#!/bin/python3

import os
from allspeak import Program

os.chdir('/home/graham/temp/Flash')
Program('flash-device.allspeak').start()
