import { Mesh, Scene, ShadowGenerator, TransformNode, UniversalCamera, Vector3 } from "@babylonjs/core";

export class Player extends TransformNode {
    public camera: any;
    public scene: Scene;
    private _input;
    private _yTilt: TransformNode | undefined;
    private _camRoot: TransformNode | undefined;

    // Player
    public mesh: Mesh;
    static ORIGINAL_TILT: Vector3;

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
        //root camera parent that handles positioning of the camera to follow the player
        this._camRoot = new TransformNode("root");
        this._camRoot.position = new Vector3(0, 0, 0); //initialized at (0,0,0)
        //to face the player from behind (180 degrees)
        this._camRoot.rotation = new Vector3(0, Math.PI, 0);
        //rotations along the x-axis (up/down tilting)
        let yTilt = new TransformNode("ytilt");
        //adjustments to camera view to point down at our player
        yTilt.rotation = Player.ORIGINAL_TILT;
        this._yTilt = yTilt;
        yTilt.parent = this._camRoot;
        //our actual camera that's pointing at our root's position
        this.camera = new UniversalCamera("cam", new Vector3(0, 0, -30), this.scene);
        this.camera.lockedTarget = this._camRoot.position;
        this.camera.fov = 0.47350045992678597;
        this.camera.parent = yTilt;
        this.scene.activeCamera = this.camera;
        return this.camera;
    }

    private _updateCamera(): void {
        if(this._camRoot){
            let centerPlayer = this.mesh.position.y + 2;
            this._camRoot.position = Vector3.Lerp(
                this._camRoot.position,
                new Vector3(
                    this.mesh.position.x,
                    centerPlayer,
                    this.mesh.position.z
                ),
                0.4
            );
        }
    }
}