<p align="right">
  <a href="README.ru.md">(🇷🇺) Russian</a>
</p>

<p align="center">
  <img src="assets/doc/logo256.png" alt="logo"></img>
</p>

<h1 align="center">KeepTheTrack</h1>

KeepTheTrack is an open-source browser extension that lets you manipulate YouTube playback, with a focus on filtering autoplay videos.

## Installation

- CRX File Way
  - Go to [releases](https://github.com/fralorange/KeepTheTrack/releases) and download the latest crx file.
  - Follow the instructions in the release description.
- Developer Mode Way
  - Download the [archive](https://github.com/fralorange/KeepTheTrack/archive/refs/heads/master.zip) with the source code, unzip the downloaded archive.
  - Build the project, you can see more in the [Build](#build) section.
  - Open the **Extensions** section of your browser.
  - Enable **Developer mode** (In the Extensions page, locate the "Developer mode" toggle and enable it).
  - Click **"Load unpacked"** button.
  - Select the root directory of the unpacked archive (the one where manifest.json is located).

## Build

Node.js 24+ is recommended.

Install dependencies:

```bash
npm install
```

Build the project:

```bash
npm run build
```

The compiled files will be generated in the dist directory.

## Usage

- Open the extension popup from the extensions menu in your browser.
- Select filters for the video.
  If there is a video from the recommendation menu that matches the filters, then at the end of the current video there will be an automatic redirect to the filtered one (overriding YouTube autoplay).

# License

The product is distributed under the MIT license.
