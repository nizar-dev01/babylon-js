import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {
    ArcRotateCamera,
    Engine,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    Scene,
    Vector3
} from '@babylonjs/core';
class App {
    constructor(){
        const canvas = document.createElement('canvas');
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "100vh";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        const engine = new Engine(canvas,true);
        const scene = new Scene(engine);

        const camera : ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
        camera.attachControl(canvas,true);

        const light1 : HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        const sphere : Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

        window.addEventListener("keydown", e =>{
            // Shift+Ctrl+Alt+I
            if (e.shiftKey && e.ctrlKey && e.altKey && e.keyCode === 73) {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                } else {
                    scene.debugLayer.show();
                }
            }
        });

        engine.runRenderLoop(()=>{
            scene.render();
        })
    }
}

new App();