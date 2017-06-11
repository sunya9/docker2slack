# docker2slack
docker2slack is simple app that notify Slack of docker's container events.

## How to use
1. Prepare Slack webhook URL [here](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks).
2. `docker run -d -e webhook=<WEBHOOK URL> --name docker2slack --restart=always sunya/docker2slack`
3. Yay!