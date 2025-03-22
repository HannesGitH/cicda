{
  description = "cicda app";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    openapi_parser.url = "github:HannesGitH/openapi_parser/3883a0f72434ec8d4d828ffb90dd604df0aa2991";
    openapi_parser.inputs.nixpkgs.follows = "nixpkgs";
    bling_cli.url = "git+https://github.com/Bling-Services/bling_cli.git?ref=flake";
  };

  outputs = { self, nixpkgs, openapi_parser, bling_cli }: let
      inherit (nixpkgs) lib;
      systems = lib.systems.flakeExposed;
      forAllSystems = lib.genAttrs systems;
      spkgs = system: nixpkgs.legacyPackages.${system}.pkgs;
    in rec{
      packages = forAllSystems (s: let pkgs = spkgs s; in with pkgs; rec {
        localizationGen = bling_cli.packages.${s}.localizationGen;
        beam_gen = pkgs.callPackage ./dependencies/beam/gen/sh.nix {
          openapi_parser = openapi_parser.packages.${s}.default;
        };
        beam_push = pkgs.callPackage ./dependencies/beam/push/sh.nix {};
        widgetbook_build = pkgs.callPackage ./dependencies/widgetbook/build/sh.nix {inherit localizationGen;};
        app = stdenv.mkDerivation (finalAttrs: rec {
          pname = "cicda";
          version = "000-0";

          src = ./.;

          propagatedBuildInputs = [
            beam_gen
            beam_push
            widgetbook_build
            bash
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

          # can be overridden with overrideAttrs
          artifact_dir = "/var/cicda/artifacts";

          buildPhase = ''
            # replace the artifact dir in the config.ts file
            ${gnused}/bin/sed -i "s|artifact_dir = .*|artifact_dir = \"${artifact_dir}\"|" config.ts
            pnpm install
            pnpm build
          '';

          installPhase = ''
            mkdir -p $out
            cp -r build/* $out
            cp -r node_modules $out
            cp -r beam_template $out
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
