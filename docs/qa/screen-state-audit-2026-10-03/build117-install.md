# Build 117 installation

The signed Debug app and App Clip are version 0.11.7 (117). Product/show validators and strict code signing passed. Source and bundled runtime proof passed with 1,746 frozen source files and 1,717 runtime resources; no drift or mismatches.

CoreDevice installation returned success for com.localparty.launcher; no uninstall was performed. Three subsequent automatic launch attempts failed due to remote XPC/tunnel connectivity errors. Installed-app inventory also failed while retrieving developer disk image metadata. Installation is confirmed by the install result; launch and version inventory readback are not confirmed. The user can open HeyPals manually. Physical motion drift correction remains pending a real throw series.

Evidence: build117-install-provenance.json; .localparty-build/install117.log; .localparty-build/launch117-final.log; .localparty-build/build117-product-proof.json.
