#!/bin/bash

# Setup script for creating a minikube instance and build the needed applications

minikube start --profile sckan --memory 6000 --cpus 4 --disk-size 60g --driver=docker

minikube --profile sckan addons enable ingress
minikube --profile sckan addons enable metrics-server


kubectl config use-context sckan
kubectl create ns sckan

eval $(minikube --profile sckan docker-env)
kubectl config use-context sckan

harness-deployment cloud-harness . -l -d sckan.local -dtls -n sckan -e dev -i portal -u
#cp deployment/helm/values.yaml /opt/cloudharness/resources/allvalues.yaml

kubectl config use-context sckan

# skaffold dev --cleanup=false
skaffold run
#helm upgrade sckan ./deployment/helm --install --reset-values --version 0.0.1 --namespace sckan --values ./deployment/helm/values.yaml --timeout 600s

echo To activate the minikube cluster please execute: eval \$\(minikube docker-env\)
