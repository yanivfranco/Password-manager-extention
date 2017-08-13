## Password-Manager Chrome-Extension ##
A simple password manager extention for google chrome browser.
This repositry contains server and client.
The passwords are encrypted and stored on the server using various cryptography encryptions.
The client is implemented using javascript and server implemnted using node js.
Database using MongoDb.

For using the extension follow the steps:

1. For running the server you should have node.js on your computer.
   If not installed on your computer node.js, please download from the following link : https://nodejs.org/en/
2. Run the server from the shell command using the command : node server.js
3. Load the extension to your chrome browser. go to extensions -> load unpack extension.load the folder of the extension 
4. If you have successfully completed the previous steps,extension icon (black key)has been added to your Chrome .
5. register to the extension and then connect.
6. Go to one of the websites where there is an login with a username and password , fill the fields and click login.
   the extension should ask you if you want to save the fields for this website , press ok for saving.
7. Load again the site and the fields will be filled in automatically

Now, continue to use the extension to keep your passwords for all the websites where you have an account.
