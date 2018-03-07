# HW1
HW1 for DevOps - https://github.com/CSC-DevOps/Course/blob/master/HW/HW1.md

Screencast 1 - [Configuring Mini VCL using Ansible](https://youtu.be/GpwFd5SRMP0) <br />
Screencast 2 - [Creating new VMs using phpVirtualBox and Vagrant](https://youtu.be/zvIiazKPTqk) <br />

- Create VM <br />
mkdir vcl <br />
cd vcl/ <br />
vagrant init bento/ubuntu-16.04 <br />
mkdir data <br />
cp ../ansible/Vagrantfile . <br />
- Edit to update IP address to 192.168.33.13 <br />
vagrant up <br />
vagrant ssh-config <br />
- Copy ssh key <br />
- Run ansible script <br />
ansible-playbook configure.yml -i inventory <br />

- Destroy VM <br />
vagrant halt <br />
vagrant destroy <br />
