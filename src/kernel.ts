import { IKernel, Kernel } from 'inversify';

var kernel: IKernel = new Kernel();

export function getKernel() {
    return kernel;
}

export function setKernel(k: IKernel) {
    kernel = k;
}

export function refreshKernel() {
    kernel = new Kernel();
}