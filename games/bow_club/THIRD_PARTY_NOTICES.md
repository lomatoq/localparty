# Provenance

Original game/network/UI/geometry/marker-detection code is included under MIT.
The DICT_4X4_50 numeric codewords and marker images were generated with OpenCV
for interoperability with the standard dictionary. Credit: OpenCV and the ArUco
project/contributors. The game now bundles OpenCV.js (including its WASM payload) for local camera processing.
https://docs.opencv.org/4.13.0/d5/dae/tutorial_aruco_detection.html

Python reference uses external OpenCV/NumPy. Keep those dependencies' license
notices when distributing them; they are not vendored in this archive. Node,
Playwright and Chromium are external tools. The managed module calls existing
LocalParty party-runtime/ws without redistributing them. Preserve host notices.

No commercial game art, fonts, photographs of people/rooms, private frames or
original binary weapons are bundled. Screenshots show deterministic game states
or synthetic marker inputs, not a camera/physical iPhone recording.

OpenCV.js packaged by @techstark/opencv-js, version 5.0.0-release.1.
Source: https://github.com/TechStark/opencv-js and https://github.com/opencv/opencv
Apache-2.0 license: public/vendor/OPENCV-LICENSE.txt.
No camera frames leave the device.
