# Touchable Alarm Clock Module for MagicMirror<sup>2</sup>

## Dependencies

* An installation of [MagicMirror<sup>2</sup>](https://github.com/MichMich/MagicMirror)

## Installation

1. Clone this repo into `~/MagicMirror/modules` directory.
1. Configure your `~/MagicMirror/config/config.js`:

    ```
    {
        module: 'MMM-TouchAlarm',
        position: 'bottom_left',
        config: {
            snoozeMinutes: 10, // I want to snooze longer
            alarmTimeoutMinutes: 5, // Stop the alarm automatically after 5 minutes
            alarmSoundFile: 'blackforest.mp3', // Play some birds
            alarmSoundFadeSeconds: 60 // Increase the volume slowly
            // ...
        }
    }
    ```

## (Currently) Known limitations

* If you snooze, the alarm time will be updated. So the next day you have to reset the alarm and reduce it by the snoozed time.

* If you close an alarm it will not be automatically be reset for the next day, you've to click the bell again.


## Config Options

| **Option** | **Default** | **Description** |
| ---                     | --- | --- |
| `minutesStepSize`       | `5` | Increasing/Decreasing the minutes in the configuration screen with this step size. |
| `snoozeMinutes`         | `5` | Alarm will be fired again in x minutes after snoozing. |
| `alarmTimeoutMinutes`   | `5` | Stop the alarm automatically after this amount of minutes. |
| ---                     | --- | --- |
| `alarmSound`            | `true` | Should an alarm sound be played. |
| `alarmSoundFile`        | `'alarm.mp3'` | Name and extension of your alarm sound. File needs to be placed in `~/MagicMirror/modules/MMM-TouchAlarm/sounds`. Standard files are `alarm.mp3` and `blackforest.mp3`.  Alternatively specify a web stream `http` or `https`. |
| `alarmSoundMaxVolume`   | `1.0` | The maximum volume of alarm (between 0.0 and 1.0). |
| `alarmSoundFade`        | `true` | Should the alarm sound file be faded. |
| `alarmSoundFadeSeconds` | `30` | Within how many seconds should the alarm reach the configured `alarmSoundMaxVolume`. |
|                         | | |
| **Expert Options**      | | |
| `debug`                 | `false` | If set to `true` it will show some debug information in the console. |
| `alarmStoreFileName`    | `alarm.json` | File name to store information even if the Magic Mirror restarts. |

## Alarm Sounds

There are already two alarm sounds:

* [alarm.mp3](http://www.orangefreesounds.com/mp3-alarm-clock/) | From Alexander licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)
* [blackforest.mp3](http://www.orangefreesounds.com/coo-coo-clock-sound/) | From Alexander licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)


## Notifications

More notifications will be implemented as soon as wished.

### Outgoing

* `MMM-TouchAlarm-ALARM-CHANGED` -> will be send `hour`: number, `minutes`: number, `active`: boolean, `nextAlarm`: moment-timestamp
* `MMM-TouchAlarm-ALARM-FIRED`   -> will be send `hour`: number, `minutes`: number
* `MMM-TouchAlarm-ALARM-SNOOZE`  -> will be send `hour`: number, `minutes`: number


## Special Thanks
Special thanks to [fewieden](https://github.com/fewieden/) for creating [MMM-AlarmClock](https://github.com/fewieden/MMM-AlarmClock) which helped a lot to create this project.



