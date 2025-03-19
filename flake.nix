{
  description = "cicda app";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    openapi_parser.url = "github:HannesGitH/openapi_parser";
  };

  outputs = { self, nixpkgs, openapi_parser }: let
      inherit (nixpkgs) lib;
      systems = lib.systems.flakeExposed;
      forAllSystems = lib.genAttrs systems;
      spkgs = system: nixpkgs.legacyPackages.${system}.pkgs;
    in {
      packages = forAllSystems (s: let pkgs = spkgs s; in with pkgs; rec {
        beam_gen = pkgs.callPackage ./dependencies/beam_gen/sh.nix {
          inherit openapi_parser;
          inherit pkgs;
        };
        app = stdenv.mkDerivation (finalAttrs: {
          pname = "cicda";
          version = "000-0";

          src = ./.;

          buildInputs = [
            beam_gen            
          ];

          nativeBuildInputs = [
            nodejs
            pnpm.configHook
          ];

          pnpmDeps = pnpm.fetchDeps {
            inherit (finalAttrs) pname version src;
            hash = "sha256-xpfwxOuYd+D3pNyIHFSxi7ldb03LQq1J7lz+gqFtxc0=";
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
          ];
        };
      });
  };
}
