import { Mesh, Scene, Vector3 } from '@babylonjs/core';

export class Environment{
    private _scene: Scene;

    constructor(scene : Scene){
        this._scene = scene;
    }

    public async load(){
        const ground = Mesh.CreateBox("ground", 24, this._scene);
        ground.scaling = new Vector3(1, 0.02, 1);
    }
}