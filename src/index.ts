import { ActionManager, BabylonFileLoaderConfiguration, Color3, Color4, DirectionalLight, Engine, ExecuteCodeAction, MeshBuilder, Scene, ShadowGenerator, StandardMaterial, Vector3 } from "@babylonjs/core";
import "@babylonjs/materials";
import { PhysicsImpostor } from '@babylonjs/core/Physics';
import { CannonJSPlugin } from '@babylonjs/core/Physics/Plugins/CannonJSPlugin';
import * as CANNON from "cannon"; // CANNON kütüphanesini içe aktarıyoruz

import { appendScene } from "./scenes/tools";

export class Game {
    /**
     * Defines the engine used to draw the game using Babylon.JS and WebGL.
     */
    public engine: Engine;
    /**
     * Defines the scene used to store and draw elements in the canvas.
     */
    public scene: Scene;

    /**
     * Constructor.
     */
    public constructor() {
        this.engine = new Engine(document.getElementById("renderCanvas") as unknown as HTMLCanvasElement, true);
        this.scene = new Scene(this.engine);

        //Fizik motoru aktifleştirilerek sahnede etkinleştirildi
        const physicsPlugin = new CannonJSPlugin(false, undefined, CANNON); // CannonJS fizik motoru eklendi
        let gravityVector = new Vector3(0, -9.82, 0);
        this.scene.enablePhysics(gravityVector, physicsPlugin);



        this._setupScene();
        this._bindEvents();
        this._loadScene().then(() => this._setupLight());
    }

    /**
     * Loads the first scene.
     */
    private async _loadScene(): Promise<void> {
        const rootUrl = "./scenes/_assets/";

        BabylonFileLoaderConfiguration.LoaderInjectedPhysicsEngine = CANNON;

        await appendScene(this.scene, rootUrl, "../scene/scene.babylon");

        // Attach camera.
        if (!this.scene.activeCamera) {
            throw new Error("No camera defined in the scene. Please add at least one camera in the project or create one yourself in the code.");
        }
        this.scene.activeCamera.attachControl(this.engine.getRenderingCanvas(), false);




        const cubeOne = this._setupCube("cube1", { x: 0, y: 5 }, { mass: 1, restitution: 0.8 });
        const sphereOne = this._setupSphere("sphere1", { x: 2, y: 5 }, { mass: 1, restitution: 3 })



        this.engine.runRenderLoop(() => {



            this.scene.render()
        });
    }

    private _setupLight() {
        const light = new DirectionalLight("directionalLight", new Vector3(0, -1, -1), this.scene);
        light.position = new Vector3(0, 10, 0);
        light.intensity = 1.0;

        const shadowGenerator = new ShadowGenerator(1024, light);

        // Gölge alıcı zemin
        const ground = this.scene.getMeshByName("ground");
        if (ground) {
            ground.receiveShadows = true;
            shadowGenerator.addShadowCaster(ground);
        }

        // Gölge alacak diğer nesneler
        shadowGenerator.addShadowCaster(this.scene.getMeshByName("cube1"));
        shadowGenerator.addShadowCaster(this.scene.getMeshByName("cube2"));
    }
    private _setupScene(): void {
        // zemin oluşturma
        const ground = MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, this.scene);
        ground.position.y = 0
        // Materyali oluştur
        const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5); // Gri zemin rengi
        ground.material = groundMaterial; // Zemine materyali ata
        this.scene.clearColor = new Color4(0.8, 0.8, 0.8, 1); // Açık gri arka plan


        ground.physicsImpostor = new PhysicsImpostor(ground,
            PhysicsImpostor.BoxImpostor,
            { mass: 0 }, // Statik nesne için kütle 0 olmalı
            this.scene);
    }

    private _setupCube(name: string, position: any, gravityOptions: any) {
        //küp oluşturma
        const cube = MeshBuilder.CreateBox(name, { size: 1 }, this.scene);
        cube.position.y = position.y ?? 0;
        cube.position.x = position.x ?? 0;

        //kup için metarial
        const cubeMaterial = new StandardMaterial("cubeMetarial", this.scene);
        cubeMaterial.diffuseColor = new Color3(1, 0, 0);
        cube.material = cubeMaterial;


        cube.actionManager = new ActionManager(this.scene);
        cube.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            //renk değiştirme
            const newColor = new Color3(Math.random(), Math.random(), Math.random());

            cubeMaterial.diffuseColor = newColor
            cube.material = cubeMaterial

        }))
        cube.physicsImpostor = new PhysicsImpostor(cube, PhysicsImpostor.BoxImpostor, gravityOptions, this.scene);
        return cube
    }

    private _setupSphere(name: string, position: any, gravityOptions: any) {
        const sphere = MeshBuilder.CreateSphere(name, { diameter: 1 }, this.scene);
        sphere.position.y = position.y ?? 0;
        sphere.position.x = position.x ?? 0;

        // Küre için materyal
        const sphereMaterial = new StandardMaterial("sphereMaterial", this.scene);
        sphereMaterial.diffuseColor = new Color3(0, 0, 1); // Mavi renk
        sphere.material = sphereMaterial;

        // Küreye fizik impostor ekleme
        sphere.physicsImpostor = new PhysicsImpostor(sphere,
            PhysicsImpostor.SphereImpostor,
            gravityOptions, // Küre için kütle ve geri yayılma ayarları
            this.scene);
        return sphere
    }


    /**
     * Binds the required events for a full experience.
     */
    private _bindEvents(): void {
        window.addEventListener("resize", () => this.engine.resize());
    }
}
