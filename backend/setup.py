# coding: utf-8

import sys

from setuptools import find_packages, setup
from version import VERSION

NAME = "SCKAN Composer"

# To install the library, run the following
#
# python setup.py install
#
# prerequisite: setuptools
# http://pypi.python.org/pypi/setuptools

REQUIRES = []

setup(
    name=NAME,
    version=VERSION,
    description="SCKAN Composer",
    author_email="zoran@metacell.us",
    url="",
    keywords=["OpenAPI", "SCKAN", "Composer"],
    install_requires=REQUIRES,
    packages=find_packages(),
    include_package_data=True,
    long_description="SCKAN Composer",
)
