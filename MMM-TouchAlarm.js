Module.register('MMM-TouchAlarm', {
    defaults: {
        minutesStepSize: 5,
        snoozeMinutes: 5,
        
        alarmTimeoutMinutes: 5,

        alarmSound: true,
        alarmSoundFile: 'alarm.mp3',
      //  alarmSoundMaxVolume: 1.0,
        alarmSoundMaxVolume: 100,

        alarmSoundFade: true,
        alarmSoundFadeSeconds: 30,

        // Expert options
        debug: false,
        defaultHour: 08,
        defaultMinutes: 00,
        alarmStoreFileName: 'alarm.json'
    },

    // Inner variables
    setTimeModalVisible: false, // current state about the visibility of the set time modal
    
    volume: 0,
    
    hour: 0, // alarm hour
    minutes: 0, // alarm minutes

    alarmCheckRunner: null, // Interval that check if a alarm is reached
    nextAlarm: null, // moment with the next alarm time
    alarmFadeRunner: null, // Intervall to handle fade of the alarm
    alarmTimeoutRunner: null, // Intervall that check if the alarm should be timed out

    // Ids to find components again
    DISPLAY_ALARM_ICON_ID: `MMM-TouchAlarm-display-alarm-icon`,
    DISPLAY_TIME_ID: `MMM-TouchAlarm-display-time`,
    ALARM_MODAL_ID: `MMM-TouchAlarm-alarm-modal`,
    ALARM_SOUND_ID: `MMM-TouchAlarm-alarm-sound`,
    SETTIME_MODAL_ID: `MMM-TouchAlarm-settime-modal`,
    SETTIME_HOUR_ID: `MMM-TouchAlarm-settime-hour`,
    SETTIME_MINUTES_ID: `MMM-TouchAlarm-settime-minutes`,

    debug() {
        if(this.config.debug) {
            console.log([].slice.apply(arguments));
        }
    },


              //  function notificationReceived(notification, payload){
              // notificationReceived: function(notification, payload) {
              //      if (notification === "alarm_volume"){
               //         this.volume = payload;
              //      }
             //   };
                

    start() {
        Log.info(`Starting module: ${this.name}`);

        this.hour = this.config.defaultHour;
        this.minutes = this.config.defaultMinutes;
    },

    getScripts() {
        return ['moment.js'];
    },

    getStyles() {
        return ['font-awesome.css', 'MMM-TouchAlarm.css'];
    },

    getDom() {
        const wrapper = document.createElement('div');
        wrapper.classList.add(`${this.name.toLowerCase()}`);

        // Clock icon
        wrapper.appendChild(this.createClockIcon());

        // Display time
        wrapper.appendChild(this.createShowAlarmTime());

        return wrapper;
    },

    isAlarmActive() {
        return this.nextAlarm !== null;
    },

    createClockIcon() {
        const clock = document.createElement('i');
        clock.setAttribute('id', this.DISPLAY_ALARM_ICON_ID);
        clock.classList.add('fa', this.isAlarmActive() ? 'fa-bell': 'fa-bell-o');
        clock.addEventListener('click', () => {
            // Stop current alarm first
            this.stopAlarm();

            // Toggle Alarm status
            this.updateAlarmActive(!this.isAlarmActive());
        });
        return clock;
    },

    updateAlarmActive(activateAlarm) {
        this.debug('updateAlarmActive(activateAlarm) called', activateAlarm);

        const clock = document.getElementById(this.DISPLAY_ALARM_ICON_ID);
        if (activateAlarm) {
            this.setNextAlarm(this.hour, this.minutes);
            this.alarmCheckRunner = setInterval(() => {
                this.checkAlarm();
            }, 1000);

            // activate alarm icon
            clock.classList.remove('fa-bell-o');
            clock.classList.add('fa-bell');
        } else {
            this.nextAlarm = null;
            // Clear active alarm check runner
            if (this.alarmCheckRunner !== null) {
                clearInterval(this.alarmCheckRunner);
                this.alarmCheckRunner = null;
            }
            
            // deactivate alarm icon
            clock.classList.remove('fa-bell');
            clock.classList.add('fa-bell-o');
        }

        this.notifyAboutAlarmChanged();
    },

    notifyAboutAlarmChanged() {
        this.sendSocketNotification(`${this.name}-ALARM-CHANGED`, {
            active: this.isAlarmActive(),
            nextAlarm: this.nextAlarm,
            hour: this.hour,
            minutes: this.minutes 
        });
    },

    playAlarmSound() {
        this.debug('playAlarmSound() called');

    /*    if(!this.config.alarmSound) {
            // Do not play any sound 
            return;
        }*/

     //   const soundPlayer = document.createElement('audio');
     //   soundPlayer.setAttribute('id', this.ALARM_SOUND_ID);

        this.sendNotification("Radioouvre", {});
        this.sendNotification("Radiolire", 1);


        this.sendNotification("VOLUME_SET", 0);
        
  /*      let srcSound = this.config.alarmSoundFile;
        if (!srcSound.match(/^https?:\/\//)) {
            srcSound = this.file(`sounds/${srcSound}`);
        }
        soundPlayer.src = srcSound;
        soundPlayer.volume = this.config.alarmSoundFade ? 0 : this.config.alarmSoundMaxVolume;
        soundPlayer.setAttribute('autoplay', true);
        soundPlayer.setAttribute('loop', true);*/

        // Start fade is wanted
        if (this.config.alarmSoundFade) {
            this.alarmFadeRunner = setInterval(() => {
                const fadeStep = this.config.alarmSoundMaxVolume / this.config.alarmSoundFadeSeconds;
    
              //  this.sendNotification("VOLUME_SET", 0);
                this.sendNotification("VOLUME_GET", {});
                
                
             //   let volume = soundPlayer.volume;
                this.volume += fadeStep;
                this.volume = Math.round(this.volume);
                if (this.volume >= this.config.alarmSoundMaxVolume) {
                    this.volume = this.config.alarmSoundMaxVolume;
                    this.sendNotification("VOLUME_SET", this.volume);
                    clearInterval(this.alarmFadeRunner);
                } else {
                    this.sendNotification("VOLUME_SET", this.volume);
                }

                this.debug('Current Sound Volume', this.volume);
            }, 1000);
        }

        // Append player to body
      //  const body = document.getElementsByTagName('body')[0];
      //  body.appendChild(soundPlayer);
    },

    stopAlarmSound() {
        this.debug('stopAlarmSound() called');

     //   const sound = document.getElementById(this.ALARM_SOUND_ID);
     //   if (sound) {
      //      sound.remove();
     //   }
        this.sendNotification("Radiostop", {});
        // Stop alarm fade if there is one running
        if (this.alarmFadeRunner) {
            clearInterval(this.alarmFadeRunner);
        }
    },

    checkAlarm() {
        this.debug('checkAlarm() called');
        if (this.nextAlarm && moment().isAfter(this.nextAlarm)) {
            // Fire alarm
            this.fireAlarm();

            // Deactivate alarm to not ring again
            this.updateAlarmActive(false);
        }
    },

    fireAlarm() {
        this.debug('fireAlarm() called');

        // Notify that the alarm was fired
        this.sendSocketNotification(`${this.name}-ALARM-FIRED`, {
            hour: this.hour,
            minutes: this.minutes 
        });

        // Start alarm sound
        this.playAlarmSound();

        // Show alarm modal
        this.showAlarmModal();

        // Start timeout counter
        this.alarmTimeoutRunner = setInterval(() => {
            this.checkAlarmTimeout();
        }, 1000);
    },

    checkAlarmTimeout() {
        this.debug('checkAlarmTimeout() called');
        const triggeredAlarm = moment({ h: this.hour, m: this.minutes });
        const timeoutMoment = triggeredAlarm.add(this.config.alarmTimeoutMinutes, 'minutes');
        if (moment().isAfter(timeoutMoment)) {
            this.stopAlarm();
        }
    },

    cancelAlarmTimeout() {
        this.debug('cancelAlarmTimeout() called');
        if (this.alarmTimeoutRunner !== null) {
            clearInterval(this.alarmTimeoutRunner);
            this.alarmTimeoutRunner = null;
        }
    },

    showAlarmModal() {
        this.debug('showAlarmModal called');

        // hide other modals
        this.hideSetTimeModal();

        // Blur other modules
        this.blurModules(true);

        const body = document.getElementsByTagName('body')[0];
        const modal = this.createAlarmModal();
        body.appendChild(modal);
    },

    hideAlarmModal() {
        this.debug('hideAlarmModal called');

        // Unblur other modules
        this.blurModules(false);

        const modal = document.getElementById(this.ALARM_MODAL_ID);
        if (modal) {
            modal.remove();
        }
    },

    createAlarmModal() {
        const modal = document.createElement('div');
        modal.setAttribute('id', this.ALARM_MODAL_ID);
        modal.classList.add('MMM-TouchAlarm-modal');
        modal.classList.add('bordered');
        modal.classList.add('alarm-container');

        // Append close icon
        modal.appendChild(this.createAlarmModalCloseIcon());
        // Append icon
        modal.appendChild(this.createAlarmModalIcon());
        // Append current alarm time
        modal.appendChild(this.createAlarmModalAlarmTime());
        // Apped snooze button
        modal.appendChild(this.createAlarmModalSnoozeButton());

        return modal;
    },

    createAlarmModalCloseIcon() {
        const iconContainer = document.createElement('div');
        iconContainer.classList.add('close-container');

        const icon = document.createElement('i');
        icon.classList.add('fa', 'fa-close', 'close-icon');
        icon.addEventListener('click', () => {
            this.stopAlarm();
        })

        iconContainer.appendChild(icon)
        return iconContainer;
    },

    createAlarmModalIcon() {
        const icon = document.createElement('i');
        icon.classList.add('fa', 'fa-bell', 'alarm');
        return icon;
    },

    createAlarmModalAlarmTime() {
        const displaySetAlarm = document.createElement('div');
        displaySetAlarm.classList.add('alarm-time')
        displaySetAlarm.innerText = this.formatFullTime(this.hour, this.minutes);
        return displaySetAlarm;
    },

    createAlarmModalSnoozeButton() {
        const snoozeButton = document.createElement('button');
        snoozeButton.classList.add('button-snooze');
        snoozeButton.innerText = 'Snooze'.toUpperCase();

        snoozeButton.addEventListener('click', () => {
            this.triggerSnooze();
        });
        return snoozeButton;
    },

    triggerSnooze() {
        this.debug('triggerSnooze() called');

        // Stop current alarm
        this.stopAlarm();

        // Set new alarm with configured snooze interval
        this.updateMinutes(this.minutes + this.config.snoozeMinutes);

        // Reactivate alarm
        this.updateAlarmActive(true);

        // Notify others that snoozed
        this.sendSocketNotification(`${this.name}-ALARM-SNOOZE`, {
            hour: this.hour,
            minutes: this.minutes
        });
    },

    stopAlarm() {
        this.debug('stopAlarm() called');

        // Stop sound
        this.stopAlarmSound();

        // Cancel running alarm timeout
        this.cancelAlarmTimeout();

        // hide alarm modal
        this.hideAlarmModal();
    },

    setNextAlarm(hour, minutes) {
        this.debug('setNextAlarm(hour, minutes) called', hour, minutes);

        let next = moment({ h: hour, m: minutes });

        // If alarm is already passed the current time ->
        if (next.isBefore(moment())) {
            // shedule it for the next day
            next = next.add(1, 'day');
        }

        this.nextAlarm = next;
    },

    createShowAlarmTime() {
        const displaySetAlarm = document.createElement('span');
        displaySetAlarm.classList.add('display-set-alarm-time');
        displaySetAlarm.setAttribute('id', this.DISPLAY_TIME_ID);
        displaySetAlarm.innerText = this.formatFullTime(this.hour, this.minutes);

        // Open config dialog if clicked
        displaySetAlarm.addEventListener('click', () => {
            // Stop current alarm first
            this.stopAlarm();
            
            this.showSetTimeModal();
        });

        return displaySetAlarm;
    },

    showSetTimeModal() {
        this.hideSetTimeModal(); // assure it's not visible before
        this.blurModules(true);
        
        // Show modal
        const body = document.getElementsByTagName('body')[0];
        const modal = this.createSetTimeModal();
        body.appendChild(modal);
    },

    hideSetTimeModal() {
        this.debug('hideSetTimeModal() called');
        this.blurModules(false);

        const modal = document.getElementById(this.SETTIME_MODAL_ID);
        if (modal) {
            modal.remove();
        }
    },

    createSetTimeModal() {
        // Modal itself
        const modal = document.createElement('div');
        modal.setAttribute('id', this.SETTIME_MODAL_ID);
        modal.classList.add('MMM-TouchAlarm-modal');
        modal.classList.add('bordered');

        modal.appendChild(this.createSetTimeModalContainer())

        return modal;
    },

    createSetTimeModalContainer() {
        const container = document.createElement('div');
        container.classList.add('settime-container');

        // Row 1
        container.appendChild(this.createSetTimeModalButtonCell('+', () => {
            this.updateHour(this.hour + 1);
        }));
        container.appendChild(this.createSetTimeModalMiddleCell(''));
        container.appendChild(this.createSetTimeModalButtonCell('+', () => {
            this.updateMinutes(this.minutes + this.config.minutesStepSize);
        }));

        // Row 2
        container.appendChild(this.createSetTimeModalNumberCell(this.SETTIME_HOUR_ID, this.formatTime(this.hour)));
        container.appendChild(this.createSetTimeModalMiddleCell(':'));
        container.appendChild(this.createSetTimeModalNumberCell(this.SETTIME_MINUTES_ID, this.formatTime(this.minutes)));
        
        // Row 3
        container.appendChild(this.createSetTimeModalButtonCell('-', () => {
            this.updateHour(this.hour - 1);
        }));
        container.appendChild(this.createSetTimeModalMiddleCell(''));
        container.appendChild(this.createSetTimeModalButtonCell('-', () => {
            this.updateMinutes(this.minutes - this.config.minutesStepSize);
        }));

        // OK Button
        container.appendChild(this.createSetTimeModalOkButton('OK'));
        return container;
    },

    createSetTimeModalOkButton(text) {
        const okButton = document.createElement('button');
        okButton.classList.add('button-ok');
        okButton.innerText = text;

        okButton.addEventListener('click', () => {
            this.hideSetTimeModal();
            this.updateAlarmActive(true);
        });
        return okButton;
    },

    updateHour(hour) {
        this.debug('updateHour(hour) called', hour);
        if(hour > 23) {
            this.hour = 0;
        } else if(hour < 0) {
            this.hour = 23;
        } else {
            this.hour = hour;
        }

        this.updateTime();
    },

    updateMinutes(minutes) {
        this.debug('updateMinutes(minutes) called', minutes);
        if(minutes > 59) {
            this.minutes = 0;
        } else if (minutes < 0) {
            this.minutes = 60 - this.config.minutesStepSize;
        } else {
            this.minutes = minutes;
        }

        this.updateTime();
    },

    updateTime() {
        document.getElementById(this.DISPLAY_TIME_ID).innerText = this.formatFullTime(this.hour, this.minutes);

        const setTimeHour = document.getElementById(this.SETTIME_HOUR_ID);
        if(setTimeHour) {
            setTimeHour.innerText = this.formatTime(this.hour);
        }

        const setTimeMinutes = document.getElementById(this.SETTIME_MINUTES_ID);
        if(setTimeMinutes) {
            setTimeMinutes.innerText = this.formatTime(this.minutes);
        }
    },

    formatFullTime(hour, minutes) {
        return this.formatTime(hour) + ":" + this.formatTime(minutes);
    },

    formatTime(input) {
        return input < 10 ? '0' + input : input;
    },

    createSetTimeModalButtonCell(innerText, callback) {
        const buttonCell = document.createElement('div');
        buttonCell.classList.add('cell');
        buttonCell.classList.add('button-cell');

        const button = document.createElement('button');
        if (callback) {
            // Add click callback if it exists
            button.addEventListener('click', callback);
        }
        button.innerText = innerText;

        buttonCell.appendChild(button);
        return buttonCell;
    },

    createSetTimeModalMiddleCell(innerText) {
        const middleCell = document.createElement('div');
        middleCell.classList.add('cell');
        middleCell.classList.add('middle-cell');
        middleCell.innerText = innerText;
        return middleCell;
    },

    createSetTimeModalNumberCell(id, innerText) {
        const numberCell = document.createElement('div');
        numberCell.setAttribute('id', id);
        numberCell.classList.add('cell');
        numberCell.classList.add('number-cell');
        numberCell.innerText = innerText;
        return numberCell;
    },

    blurModules(blur) {
        const modules = document.querySelectorAll('.module');
        for (let i = 0; i < modules.length; i += 1) {
            if (!modules[i].classList.contains(this.name)) {
                if (blur) {
                    modules[i].classList.add(`${this.name}-blur`);
                } else {
                    modules[i].classList.remove(`${this.name}-blur`);
                }
            }
        }
    },

    // Handle notifications from node_helper
    socketNotificationReceived(notification, payload) {
        this.debug('socketNotificationReceived(notification, payload) called', notification, payload);

        // Handle if somebody want to update the current alarm
        if (notification === `${this.name}-UPDATE-ALARM`) {
            this.updateHour(payload.hour);
            this.updateMinutes(payload.minutes);
            this.updateAlarmActive(payload.active);

            if(payload.active) {
                // If the alarm is/was active set nextAlarm and check if it is gone already
                this.nextAlarm = payload.nextAlarm;
                this.checkAlarm();
            }
        }
    },

    // Handle general notifications from MagicMirror
    notificationReceived(notification, payload) {
        this.debug('notificationReceived(notification, payload) called', notification, payload);

        // Notify node helper that we're ready
        if (notification === 'DOM_OBJECTS_CREATED') {
            this.sendSocketNotification(`${this.name}-STARTED`, {
                config: this.config,
                alarmFile: this.file(this.config.alarmStoreFileName)
            });
        }
        if (notification === "alarm_volume"){
                this.volume = payload;
        }
        if (notification === "kal-activealarme") { 
            this.hour = payload.split("h")[0];
            this.minutes = payload.split("h")[1];
            if (this.minutes < 10) {
                this.minutes = this.minutes.substr(1,1);
                if (this.minutes.length < 1) {
                    this.minutes = "0" + this.minutes;
                }
            }
            if (this.minutes >= 60) {
                this.hour = this.hour +1;
            }
            
          //  this.sendNotification("SHOW_ALERT", {type: "notification", title: "ALARME", message: this.hour + "heur" + this.minutes});
            
            this.setNextAlarm(this.hour, this.minutes);
            logsys = {"active":true,"nextAlarm":this.nextAlarm ,"hour":this.hour,"minutes":this.minutes};
            this.sendSocketNotification(`${this.name}-ALARM-CHANGED`, logsys);
            this.updateAlarmActive(true);
            this.updateDom();
        }
        if (notification === "kal-stopalarme") { 
            
        //    this.sendNotification("SHOW_ALERT", {type: "notification", title: "STOP ALARME", message: "STOP ALARME"});
            this.stopAlarm();
        }
    }

});
