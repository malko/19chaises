(function() {
	'use strict';
	// does browser support passive event listener
	let supportsPassive = false;
	try {
	  const opts = Object.defineProperty({}, 'passive', {
		 get: function() {
			supportsPassive = true;
		 }
	  });
	  window.addEventListener('testPassive', null, opts);
	  window.removeEventListener('testPassive', null, opts);
	} catch (e) {}
	const passiveListenerArgument = supportsPassive ? { passive: true } : false;

	let audioCtx = (window.AudioContext || window.webkitAudioContext);
	if (audioCtx) {
		audioCtx = new audioCtx();
	} else {
		return new Error("audio context not supported");
	}

	class Sound {
		constructor(audioCtx, srcUrl) {

			let source;
			let bufferPromise = fetch(srcUrl)
				.then((r) => r.arrayBuffer())
				.then((buffer) => audioCtx.decodeAudioData(buffer))
			;

			this.start = () => {
				audioCtx.resume();
				bufferPromise.then((buffer) => {
					source = audioCtx.createBufferSource();
					source.connect(audioCtx.destination);
					source.buffer = buffer;
					source.onended = () => this.stop();
					source.loop = false;
					source.start(0);
				});

			}
			this.stop = () => this.onstopped();
			this.onstopped = () => {};
		}
	}

	class SoundButton {
		constructor(element, sound) {
			this.elmt = element;
			this.sound = sound;

			this.elmt.start = () => this.start();
			this.elmt.stop = () => this.stop();

			this.playPauseCallback = () => {
				this.elmt.classList.contains('playing') ? this.stop() : this.start();
			}

			this.attachListeners();
		}

		attachListeners() {
			this.elmt.addEventListener('mousedown', this.playPauseCallback, passiveListenerArgument);
			this.elmt.addEventListener('touchstart', this.playPauseCallback, passiveListenerArgument);
		}

		removeListeners() {
			this.elmt.removeEventListener('mousedown', this.playPauseCallback);
			this.elmt.removeEventListener('touchstart', this.playPauseCallback);
		}

		start() {
			this.elmt.classList.add('playing');
			this.sound.start();
			this.sound.onstopped = () => this.elmt.classList.remove('playing');
		}

		stop() {
			this.sound.stop();
		}
	}

	const Installer = function(rootElement) {
		let promptEvent;

		const install = function(e) {
		  if(promptEvent) {
			 promptEvent.prompt();
			 promptEvent.userChoice
				.then(function(choiceResult) {
				  // The user actioned the prompt (good or bad).
				  // good is handled in
				  promptEvent = null;
				  rootElement.classList.remove('available');
				})
				.catch(function(installError) {
				  // Boo. update the UI.
				  promptEvent = null;
				  rootElement.classList.remove('available');
				});
		  }
		};

		const installed = function(e) {
		  promptEvent = null;
		  // This fires after onbeforinstallprompt OR after manual add to homescreen.
		  rootElement.classList.remove('available');
		};

		const beforeinstallprompt = function(e) {
		  promptEvent = e;
		  promptEvent.preventDefault();
		  rootElement.classList.add('available');
		  return false;
		};

		window.addEventListener('beforeinstallprompt', beforeinstallprompt);
		window.addEventListener('appinstalled', installed);

		rootElement.addEventListener('click', install.bind(this));
		rootElement.addEventListener('touchend', install.bind(this));
	};


	window.addEventListener('load', function() {
		const chaiseSound = new Sound(audioCtx, '/19chaises.wav');
		const chaiseButton = new SoundButton(document.getElementById('chaises'), chaiseSound);
		const installer = new Installer(document.getElementById('installer'));

		document.addEventListener('visibilitychange', function() {
			if (document.hidden) {
				chaiseButton.elmt.stop();
			}
		});
	});
})();