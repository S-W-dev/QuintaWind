# Pool Controller

## What is it?
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;The Pool Controller is basically a server that runs on a raspberry pi zero and controlls pentair based pool systems. Because the Pentair system is incredibly bad, we decided to make our own system that allows you to quickly, easily, and efficiently interface with their hardware. Although some features like the web control panel may not function correctly if you are not on the same network as the Pi, you can always just take the Pi with you to a hotel room or similar and it will work just fine.

## How does it work?
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;The Pool Controller program is essentially a NodeJS server. All the magic happens in the node-screenlogic library for NodeJS. All you have to do is tell our server what you want to happen, and it will execute all the required commands so you don't have to.

## How do I use it?
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Since the server is hosted on your home network, you can access it from any device that is connected to the same network. You can use the control panel using any of the following methods:

- HTTP/S hosted website running on the Pi
- Amazon Alexa Skill (Google assistant, etc. coming soon)
- Using the Pool Controller app made by Concrete Games on Google Play and the App Store
- Using Bixby, Siri, etc. alongside the mobile app.
- Using Android widgets directly on your home screen

The Amazon Alexa Skill and Pool Controller App (includes voice assistant and widgets) can be used from anywhere in the world as long as the Pi is plugged in and running.

NOTE: Although the server is running on your local network, you can port forward ports 80 and 443 on your router so that you can access if from anywhere. 

## What happens if it breaks?

We are always here to help with software and hardware related problems. Also keep in mind that this is just an extension of your already-functional system. That means that you can still use the provided app that comes with all Pentair systems.

## What makes this better Pentair's own systems?

Our techologies are far more advanced and are easier to use than Pentair's. While Pentair focuses on making money, we focus on making functional products. Our services also make Pentair's app completly obsolete. 