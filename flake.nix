{
  description = "cicda app";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    openapi_parser.url = "github:HannesGitH/openapi_parser/3883a0f72434ec8d4d828ffb90dd604df0aa2991";
    openapi_parser.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { self, nixpkgs, openapi_parser }: let
      inherit (nixpkgs) lib;
      systems = lib.systems.flakeExposed;
      forAllSystems = lib.genAttrs systems;
      spkgs = system: nixpkgs.legacyPackages.${system}.pkgs;
    in rec{
      packages = forAllSystems (s: let pkgs = spkgs s; in with pkgs; rec {
        beam_gen = pkgs.callPackage ./dependencies/beam/gen/sh.nix {
          openapi_parser = openapi_parser.packages.${s}.default;
        };
        beam_push = pkgs.callPackage ./dependencies/beam/push/sh.nix {};
        widgetbook_build = pkgs.callPackage ./dependencies/widgetbook/build/sh.nix {};
        app = stdenv.mkDerivation (finalAttrs: {
          pname = "cicda";
          version = "000-0";

          src = ./.;

          buildInputs = [
            beam_gen
            beam_push
            widgetbook_build
          ];

          nativeBuildInputs = [
            nodejs
            pnpm.configHook
            pkg-config
          ];

          pnpmDeps = pnpm.fetchDeps {
            inherit (finalAttrs) pname version src;
            hash = "sha256-USKovI6SMR/P7Nr1jgF4sw36qE+eURhmy1hvriUFVVo=";
          };

          buildPhase = ''
            pnpm install
            pnpm build
          '';

          installPhase = ''
            mkdir -p $out
            cp -r build/* $out
          '';

        });
        default = app;
      });

      devShells = forAllSystems (s: with spkgs s; {
        default = mkShell {
          buildInputs = [
            nodejs
            pnpm
            packages.${s}.beam_gen
            packages.${s}.beam_push
            packages.${s}.widgetbook_build
          ];
        };
      });
  };
}
