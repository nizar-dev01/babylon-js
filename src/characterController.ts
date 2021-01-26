import { ArcRotateCamera, Mesh, Scene, ShadowGenerator, TransformNode, Vector3 } from "@babylonjs/core";

export class Player extends TransformNode {
    public camera: any;
    public scene: Scene;
    private _input;

    // Player
    public mesh: Mesh;

    constructor(assets: any, scene: Scene, shadowGenerator: ShadowGenerator, input?: any){
        super("player", scene);
        this.scene = scene;
        this._setupPlayerCamera();

        this.mesh = assets.mesh;
        this.mesh.parent = this;

        shadowGenerator.addShadowCaster(assets.mesh);
        this._input = input;
    }

    private _setupPlayerCamera() {
        const camera = new ArcRotateCamera(
            "arc", // name`
            -Math.PI/2, // alpha
            -Math.PI/2, // beta
            40, // radius
            new Vector3(0, 3, 0), // target
            this.scene // scene
        );
        camera.attachControl();
    }
}