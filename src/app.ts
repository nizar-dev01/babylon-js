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

    private _state: number = 0;

    constructor(){
        this._canvas = document.createElement('canvas');
        this._canvas.style.display = "block";
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100vh";
        this._canvas.id = "gameCanvas";
        document.body.appendChild(this._canvas);

        this._engine = new Engine(this._canvas,true);
        this._scene = new Scene(this._engine);

        const camera : ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), this._scene);
        camera.attachControl(this._canvas,true);

        const light1 : HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), this._scene);
        const sphere : Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, this._scene);

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

        window.addEventListener("resize",()=>{
            this._engine.resize();
        });

        this._engine.runRenderLoop(()=>{
            this._scene.render();
        })
    }

    private async _goToStart() {
        this._engine.displayLoadingUI();

        this._scene.detachControl();

        const scene = new Scene(this._engine);
        scene.clearColor = new Color4(0, 0, 0, 1);

        const camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero());

        //--SCENE FINISHED LOADING--
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

    private async _goToCutScene(){
        
    }
}

new App();