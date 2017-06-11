const Dockerode = require('dockerode')
const SlackWebhook = require('slack-webhook')

class Docker2Slack {
  constructor() {
    this.onFinished = this.onFinished.bind(this)
    this.onProgress = this.onProgress.bind(this)
    this.send = this.send.bind(this)

    if(!this.webhookUrl) {
      throw new Error('You must be set `webhook` environment variable.')
    }

    this.slack = new SlackWebhook(this.webhookUrl)

    this.docker = new Dockerode()
    this.docker.getEvents().then(stream => {
      this.docker.modem.followProgress(stream, this.onFinished, this.onProgress)
    })
  }

  onFinished(err, output) {
    if(err) console.error(err)
    console.log(output)
  }

  onProgress(event) {
    if(event.Type !== 'container') return
    if(!Docker2Slack.DEFAULT_FILTER.includes(event.Action)) return
    console.log(event.status, event.from)
    this.send(event)
  }

  get webhookUrl() {
    return process.env.webhook
  }

  send(event) {
    const addFields = Object.keys(event.Actor.Attributes)
      .filter(key => key !== 'name' && key !== 'image')
      .sort()
      .map(key => {
        return {
          title: key,
          value:event.Actor.Attributes[key],
          short: true
        }
      })
    const baseFields = [{
      title: 'Name',
      value: event.Actor.Attributes.name,
      short: true
    }, {
      title: 'ID',
      value: event.Actor.ID.substring(0, 12),
      short: true
    }, {
      title: 'Image',
      value: event.Actor.Attributes.image,
      short: true
    }, {
      title: 'At',
      value: new Date(event.time * 1000),
      short: true
    }]
    const fields = baseFields.concat(addFields)
    this.slack.send({
      text: `${event.status[0].toUpperCase() + event.status.slice(1)} ${event.Actor.Attributes.name}.`,
      attachments: [{
        title: 'Event',
        text: event.status,
        fields
      }]
    })
  }
}

Docker2Slack.DEFAULT_FILTER = [
  'die',
  'restart',
  'start',
  'stop'
]

module.exports = Docker2Slack