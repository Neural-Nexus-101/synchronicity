<img src="src/assets/img/icon-128.png" width="64"/>
git 
# ErgoPro-AI

This extension helps you keep track of your posture as you surf the web by first taking a baseline of you sitting with good posture, and then applying a 'blur' effect when you start to deviate from your recorded "good posture" position. As soon as you sit back up, the blur goes away and you're back to browsing!



## Installing and Running In Developer Mode

### Procedures

1. Check if your [Node.js](https://nodejs.org/) version is >= **14**.
2. Clone this repository.
3. Run `npm install` to install the dependencies.
4. Run `npm start`
5. Load the extension on Chrome following:
   1. Access `chrome://extensions/`
   2. Check `Developer mode`
   3. Click on `Load unpacked extension`
   4. Select the `build` folder.
6. Launch the Extension.
   1. Open the `Options Popup` by clicking the button in the browser action menu
   2. Start the camera

## You'll need to allow camera access on first use

   3. Wait for the Model Tracking to kick in

## you'll need to make the Options window visible / active at least once for the tracking to work correctly

   4. surf the web with good posture!
      - you can reset the "Good Posture" position with the browser action menu
