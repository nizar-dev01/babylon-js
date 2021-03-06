import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {
    AdvancedDynamicTexture,
    Button,
    Control
} from "@babylonjs/gui";
import {
    Color3,
    Color4,
    Engine,
    FreeCamera,
    HemisphericLight,
    Matrix,
    Mesh,
    MeshBuilder,
    PointLight,
    Quaternion,
    Scene,
    ShadowGenerator,
    StandardMaterial,
    Vector3,
} from '@babylonjs/core';

import { Environment } from "./environment";
import { Player } from "./characterController";

enum State { START = 0, GAME = 1, LOSE = 2, CUTSCENE = 3 };
class App {

    private _scene : Scene;
    private _canvas : HTMLCanvasElement;
    private _engine : Engine;
    
    private _gameScene: Scene | undefined;
    private _cutScene: Scene | undefined;

    private _state: Number = 0;
    private _environment: Environment | undefined;

    // Game related variables
    public assets: any;
    public _player : any;

    constructor(){
        this._canvas = this._createCanvas();
        this._engine = new Engine(this._canvas,true);
        this._scene = new Scene(this._engine);

        window.addEventListener("keydown", e =>{
            // Shift+Ctrl+Alt+I
            if (e.shiftKey && e.ctrlKey && e.altKey && e.keyCode === 73) {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show();
                }
            }
        });

        this._main();
        
    }

    private _createCanvas(): HTMLCanvasElement {
        document.documentElement.style["overflow"] = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.width = "100%";
        document.documentElement.style.height = "100%";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.overflow = "hidden";
        document.body.style.width = "100%";
        document.body.style.height = "100%";
        document.body.style.margin = "0";
        document.body.style.padding = "0";

        const canvas = document.createElement('canvas');
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";

        document.body.appendChild(canvas);
        return canvas;
    }

    private async _main(): Promise<void>{
        await this._goToStart();
        
        this._engine.runRenderLoop(()=>{
            switch (this._state){
                case State.START:
                    this._scene.render();
                    break;
                case State.CUTSCENE:
                    this._scene.render();
                    break;
                case State.GAME:
                    this._scene.render();
                    break;
                case State.LOSE:
                    this._scene.render();
                    break;
                default: break;
            }
        });

        window.addEventListener("resize",()=> this._engine.resize() );
    }

    private async _goToStart() {
        this._engine.displayLoadingUI();
        this._scene.detachControl();

        const scene = new Scene(this._engine);
        scene.clearColor = new Color4(0, 0, 0, 1);

        const camera = new FreeCamera(
            "startCamera", // Name
            new Vector3(0, 0, 0), // Camera Position
            scene
        );
        camera.setTarget(Vector3.Zero());

        // Wait until the scene finishes loading
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI();

        this._scene.dispose();
        this._scene = scene;
        this._state = State.START;

        // Creating GUI

        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720;

        const startBtn = Button.CreateSimpleButton("start", "PLAY");
        startBtn.width = 0.2;
        startBtn.height = "40px";
        startBtn.color = "white";
        startBtn.top = "-14px";
        startBtn.thickness = 0;
        startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

        guiMenu.addControl(startBtn);

        startBtn.onPointerDownObservable.add(()=>{
            this._goToCutScene();
            scene.detachControl();
        })
    }

    private async _goToCutScene(): Promise<void> {
        this._engine.displayLoadingUI();
        this._scene.detachControl();

        // create cutScene
        this._cutScene = new Scene(this._engine);
        const camera = new FreeCamera("cutSceneCamera", new Vector3(0, 0, 0), this._cutScene);
        camera.setTarget(Vector3.Zero());
        this._cutScene.clearColor = new Color4(0, 0, 0, 1);


        // Create GUI
            const testUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
            // Next Button ( for testing purposes )
            const next = Button.CreateSimpleButton("next", "START PLAYING");
            next.color = "white";
            next.thickness = 0;
            next.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            next.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
            next.width = "200px"
            next.height = "64px";
            next.top = "-3%";
            next.left = "-12%";
            testUI.addControl(next);

            next.onPointerDownObservable.add(()=>{
                this._goToGame();
            });
        //
        
        await this._cutScene.whenReadyAsync();
        this._engine.hideLoadingUI();
        this._scene.dispose();
        this._state = State.CUTSCENE;
        this._scene = this._cutScene;
        
        let finishedLoading = false;
        await this._setUpGame().then( res => {
            finishedLoading = true;
        });

    }

    private async _setUpGame(){
        const scene = new Scene(this._engine);
        this._gameScene = scene;

        this._environment = new Environment(scene);
        await this._environment.load();
        await this._loadCharacterAssets(scene);
    }
    
    private async _loadCharacterAssets(scene: Scene){
        async function loadCharacter(){
            // Collision Mesh
            const outer = MeshBuilder.CreateBox(
                "outer-box",
                {
                    width: 2,
                    height: 3,
                    depth: 1
                },
                scene
            );
            outer.isVisible = false;
            outer.isPickable = false;
            outer.checkCollisions = true;
            
            //move origin of box collider to the bottom of the mesh (to match imported player mesh)
            outer.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0));

            // for collisions
            outer.ellipsoid = new Vector3(1, 1.5, 1);
            outer.ellipsoidOffset = new Vector3(0, 1.5, 0);
            // rotate the player mesh 180 since we want to see the back of the player
            outer.rotationQuaternion = new Quaternion(0, 1, 0 ,0);
            
            // Creating a Capsule Collider
            const box = MeshBuilder.CreateBox(
                "small-box",
                {
                    width: 0.5,
                    depth: 0.5,
                    height: 0.25,
                    faceColors: [
                        new Color4(0, 0, 0, 1),
                        new Color4(0, 0, 0, 1),
                        new Color4(0, 0, 0, 1),
                        new Color4(0, 0, 0, 1),
                        new Color4(0, 0, 0, 1),
                        new Color4(0, 0, 0, 1)
                    ]
                },
                scene
            );
            box.position.y = 1.5;
            box.position.z = 1;

            const body = Mesh.CreateCylinder(
                "body", 3, 2, 2, 0, 0, scene
            );
            const bodyMtrl = new StandardMaterial("red", scene);
            bodyMtrl.diffuseColor = new Color3(0.8, 0.5, 0.5);
            body.material = bodyMtrl;
            body.isPickable = false;
            // simulates the imported mesh's origin
            body.bakeTransformIntoVertices(
                Matrix.Translation(0, 1.5, 0)
            );

            // Parent the meshes
            box.parent = body;
            body.parent = outer;

            return {
                mesh: outer as Mesh
            }
        }

        return loadCharacter().then((assets) => {
            this.assets = assets;
        });
    }

    private async _initializeGameAsync(scene: Scene): Promise<void> {
        //temporary light to light the entire scene
        const light0 = new HemisphericLight("HemiLight", new Vector3(0, 1, 0), scene);
        const light = new PointLight("sparklight", new Vector3(0, 0, 0), scene);
        light.diffuse = new Color3(0.08627450980392157, 0.10980392156862745, 0.15294117647058825);
        light.intensity = 35;
        light.radius = 1;
        const shadowGenerator = new ShadowGenerator(1024, light);
        shadowGenerator.darkness = 0.4;
        //Create the player
        this._player = new Player(this.assets, scene, shadowGenerator); //dont have inputs yet so we dont need to pass it in
    }
    
    private async _goToGame(){
        // Setting up the scene
        this._scene.detachControl();
        const scene = this._gameScene;
        if(scene){
            scene.clearColor = new Color4(0.01568627450980392, 0.01568627450980392, 0.20392156862745098);

            const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");

            // disable all inputs from while the game is loading
            scene.detachControl();

            const loseBtn = Button.CreateSimpleButton("lose", "LOSE");
            loseBtn.width = 0.2
            loseBtn.height = "40px";
            loseBtn.color = "white";
            loseBtn.top = "-14px";
            loseBtn.thickness = 0;
            loseBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            playerUI.addControl(loseBtn);

            loseBtn.onPointerDownObservable.add(()=>{
                this._goToLose();
                scene.detachControl();
            });

            await this._initializeGameAsync(scene); //handles scene related updates & setting up meshes in scene
            
            const outerMesh = scene.getMeshByName("outer-box");
            if(outerMesh) outerMesh.position = new Vector3(0, 3, 0);

            //--WHEN SCENE FINISHED LOADING--
            await scene.whenReadyAsync();

            //get rid of start scene, switch to gamescene and change states
            this._scene.dispose();
            this._state = State.GAME;
            this._scene = scene;
            this._engine.hideLoadingUI();
            this._scene.attachControl();
        }
    }

    private async _goToLose() : Promise<void> {
        this._engine.displayLoadingUI();

        // Setting up the scene
        this._scene.detachControl();
        const scene = new Scene(this._engine);
        scene.clearColor = new Color4(0, 0, 0, 1);

        const camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);

        // GUI Menu
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const mainBtn = Button.CreateSimpleButton("mainmenu", "MAIN MENU");
        mainBtn.width = 0.2;
        mainBtn.height = "40px";
        mainBtn.color = "white";
        guiMenu.addControl(mainBtn);
        // listen for pinter events
        mainBtn.onPointerUpObservable.add(()=>{
            this._goToStart();
        });

        // Wait until the scene finishes loading
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI();
        this._scene.dispose();
        this._scene = scene;
        this._state = State.LOSE;
    }
}

new App();