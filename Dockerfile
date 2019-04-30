# Sets up a full-stack MERN web app from the ground up. Include networking and connection to the current working directory by invoking with the following command:
# docker run -it -v $(pwd):/host/$(basename $(pwd)) adadiehl/MERN_stack
# The mongoDB component is cloud-based in this stack. See https://mlab.com/

FROM node:11.12.0-stretch
MAINTAINER Adam Diehl <adadiehl@umich.edu>

# Expose the ports needed for node.js and express
EXPOSE 3000
EXPOSE 3001
EXPOSE 9200

ENV DEBIAN_FRONTEND noninteractive

# Install packages needed for non-root login/permissions control
RUN apt-get update && apt-get -y --no-install-recommends install \
    ca-certificates \
    curl \
    sudo

RUN gpg --keyserver ha.pool.sks-keyservers.net --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4
RUN curl -o /usr/local/bin/gosu -SL "https://github.com/tianon/gosu/releases/download/1.4/gosu-$(dpkg --print-architecture)" \
    && curl -o /usr/local/bin/gosu.asc -SL "https://github.com/tianon/gosu/releases/download/1.4/gosu-$(dpkg --print-architecture).asc" \
    && gpg --verify /usr/local/bin/gosu.asc \
    && rm /usr/local/bin/gosu.asc \
    && chmod +x /usr/local/bin/gosu

# We need to install conda and pybedtools packages to enable on-the-fly intersections.
RUN apt-get update && apt-get -y --no-install-recommends install bedtools python-setuptools python-dev build-essential
RUN easy_install pip
RUN pip install --upgrade virtualenv
RUN pip install pybedtools

COPY entrypoint.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]


# Intall emacs to enable in-place file editing
RUN apt-get -y --no-install-recommends install emacs

# Install and configure elasticsearch and dependencies
RUN apt-get -y --no-install-recommends  install openjdk-8-jre
RUN wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
RUN apt-get install -y --no-install-recommends apt-transport-https
RUN echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-7.x.list
RUN sudo apt-get update && apt-get -y --no-install-recommends install elasticsearch
RUN sudo update-rc.d elasticsearch defaults 95 10

# Install packages and dependencies for the web app
#RUN npm i -g create-react-app
#RUN npm i -S axios mongoose express body-parser morgan concurrently
#RUN npm install --save express-fileupload
