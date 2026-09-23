# LocalParty 0.11.1 (24) — drone multitouch

Drop now responds directly to pointer-down, including non-primary touch contacts while the joystick owns another pointer. Mouse compatibility clicks are ignored; keyboard/accessibility activation remains supported. The joystick ignores unrelated pointer-down/up/cancel/capture-loss events instead of transferring or releasing the pilot contact.

Verification: seven drone engine tests and the WebKit drone lifecycle test passed. The regression holds a real captured pointer, injects a non-primary second contact to Drop, asserts one command despite a subsequent compatibility click, then checks the real server enters flight and releases the joystick. It also checks that an unrelated joystick contact does not steal/release the first contact. This is automated event-level coverage, not a manual two-finger test on the physical phone.

Release build 24 completed with iPhoneOS 27 SDK. Product validation confirmed the updated controller and all 36 catalog entries in the signed application.
