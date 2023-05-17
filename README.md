# Auth0 OTP Phone Number Verification

This extension provides a rule and interface for giving users the option verifying and account using passwordless SMS
with an registered user with phone number on the profile.

> **NOTE:** Please make sure all the users that don't need to be verified are tagged with app_metadata.isVerified=true. This extension needs to be tested before deploying in production.

**Build**
>nvm use 8
yarn install
yarn run build

