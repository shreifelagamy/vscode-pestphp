import * as vscode from 'vscode';

let packageConfig: vscode.WorkspaceConfiguration;

export default {
    get isDockerEnabled(): boolean {
        return (packageConfig.get('docker.enabled') !== undefined
            && packageConfig.get('docker.enabled') !== null)
            || (packageConfig.get('docker.command') !== undefined
                && packageConfig.get('docker.command') !== null);
    },
    get dockerCommand(): string {
        return packageConfig.get('docker.command') ?? 'docker exec';
    },
    get dockerConatinerName(): string {
        return packageConfig.get('docker.container_name') ?? '';
    },
    get path(): string {
        return packageConfig.get('path') ?? './vendor/bin/pest';
    }
};

export function loadConfigs() {
    // Load configs here
    packageConfig = vscode.workspace.getConfiguration('pestphp');
}