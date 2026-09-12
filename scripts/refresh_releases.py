"""Development-only refresh: rebuild Node-only releases from verified cached runtimes.

Rebuilding from the inclusion list also removes obsolete files from older versions.
"""
from package_release import TARGETS, manifest_from_cache, build

if __name__ == '__main__':
    build(TARGETS, manifest_from_cache(TARGETS))
