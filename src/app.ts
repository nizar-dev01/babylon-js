import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {
    AdvancedDynamicTexture,
    Button,
    Control
} from "@babylonjs/gui";
import {
    ArcRotateCamera,
    Color4,
    Engine,
    FreeCamera,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    Scene,
    Vector3,
} from '@babylonjs/core';

enum State { START = 0, GAME = 1, LOSE = 2, CUTSCENE = 3 };
class App {

    private _scene : Scene;
    private _canvas : HTMLCanvasElement;
    private _engine : Engine;
    
    private _gameScene: Scene | undefined;
    private _cutScene: Scene | undefined;

    private _state: Number = 0;

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

        const camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero());

        // Wait until the scene finishes loading
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI();

        this._scene.dispose();
        this._scene = scene;
        this._state = State.START;

        // Scene Setup

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
        const camera = new FreeCamera("camera1", new Vector3(0, 0, 0), this._cutScene);
        camera.setTarget(Vector3.Zero());
        this._cutScene.clearColor = new Color4(0, 0, 0, 1);


        // Create GUI
        const cutScene = AdvancedDynamicTexture.CreateFullscreenUI("cutscene");
        // Next Button ( for testing purposes )
        const next = Button.CreateSimpleButton("next", "NEXT");
        next.color = "white";
        next.thickness = 0;
        next.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        next.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        next.width = next.height = "64px";
        next.top = "-3%";
        next.left = "-12%";
        cutScene.addControl(next);

        next.onPointerDownObservable.add(()=>{
            alert("clicked Hi Hi!");
        })

        let finishedLoading = false;
        await this._setUpGame().then( res => {
            finishedLoading = true;
            this._goToGame();
        });

    }

    private async _setUpGame(){
        const scene = new Scene(this._engine);
        this._gameScene = scene;

        //...load assets
    }

    private async _goToGame(){
        // Setting up the scene
        this._scene.detachControl();
        const scene = this._gameScene;
        if(scene){
            scene.clearColor = new Color4(0.01568627450980392, 0.01568627450980392, 0.20392156862745098);
            const camera = new ArcRotateCamera(
                "Camera", // name
                Math.PI /2, // camera rotation along the longitudinal axis.
                Math.PI /2, // camera rotation along the latitudinal axis
                2, // radius
                Vector3.Zero(), // target
                scene // scene
            );
            camera.setTarget(Vector3.Zero());

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

            // LIGHTS
            const light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
            const spehere: Mesh = MeshBuilder.CreateSphere(
                "sphere",
                {
                    diameter: 1
                },
                scene
            );

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