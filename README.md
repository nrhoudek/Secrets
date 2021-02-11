# Secrets
A Node.js app loosely based on the app Whisper. The focal point of this app was to learn Security and Authentication. This app uses Passport and OAuth to allows users to register an account and post whatever secret they have anonymously. The Database for this app is done with MongoDB and connected through Mongoose. If a user registers locally, their password is hashed and salted before being stored in the Database. I, myself, do not have access to any stored passwords, but can see the email an account used to register with and the secrets associated with that account. If Google or Twitter are used to register, I can only see their Google/Twitter ID.

The design of the app was not the focal point, so it is pretty barebones, and errors will just take you to the your browser's standard error page. In addition, there is no email verification or password requirements (which I knows goes against the whole security point just mention), but, again, that was not the focus of this project. 

Unless some type of huge security issue is found, I will probably leave this app be and move onto my next project for more learning. Thanks to all who see this.
