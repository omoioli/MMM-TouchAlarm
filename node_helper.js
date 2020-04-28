const fs = require('fs');
const NodeHelper = require('node_helper');

module.exports = NodeHelper.create({
    alarmFile: '', // will be set when module is started

    start() {
        console.log(`Starting module helper: ${this.name}`);
    },

    socketNotificationReceived(notification, payload) {
        console.log('nodeHelper, socketNotificationReceived', notification, payload);
        if (notification === `${this.name}-STARTED`) {
            this.alarmFile = payload.alarmFile;
            this.readSavedAlarm();
        } else if (notification === `${this.name}-ALARM-CHANGED`) {
            this.updateSavedAlarm(payload);
        } else if (notification === "VOLUME_RESULT") {
            this.sendNotification( "alarm_volume", payload);
        }
    },

    readSavedAlarm() {
        fs.stat(this.alarmFile, (error, stats) => {
            if (!error && stats.isFile()) {
                const data = fs.readFileSync(this.alarmFile);
                if (data) {
                    const alarmData = JSON.parse(data);
                    this.sendSocketNotification(`${this.name}-UPDATE-ALARM`, alarmData);
                }
            }
        });
    },

    updateSavedAlarm(alarmData) {
        fs.writeFileSync(this.alarmFile, JSON.stringify(alarmData));
    }
});
