# Message-Broker
Freelancer Project

Functional Requirements

Creating a module for node.js to automate the sending emails and SMS.
The module will read the .eml ( for email ) or .sms ( text file for SMS ) files present in a special directory and put messages in to send queue.
When an external program insert a message file in the appropriate folder, the system will put the message in the submission queue and will be sent as soon as possible.
The program will be provided to must perform the operations continuously, will have to be started as a server service.
The operations performed by the system must will have to be saved in a separate daily log file.

Technical Requirements
- Made entirely in JavaScript / node.js
- Use the node module "mailparser"
- Using the node module "Kue" ( used for queue and task management )
- Configuration file must be written in JSON file

Other "No Functional Requirements"
The project will be managed in Git repository GitLab made available by us.
We provide the JSON file pattern configuration and message information file and other technical documentation.
