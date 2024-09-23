import * as THREE from "./build/three.module.js";
import { OrbitControls } from "./jsm/OrbitControls.js";

let scene, camera, renderer, pointLight, controls, canvas, txtloader, weather_mesh;

window.addEventListener("load", init);

function init(){
    console.log("start")
    canvas = document.querySelector( '#earth' );
    canvas.width = window.innerWidth*0.8
    canvas.height = window.innerHeight
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        50,
        canvas.width/canvas.height,
        0.1,
        1000
    );
    //カメラの移動
    camera.position.set(0,0,+500);
    
    
    renderer = new THREE.WebGLRenderer({alpha: true, canvas });
    renderer.setSize(canvas.width, canvas.height);
    renderer.setPixelRatio(window.devicePixelRatio);
    txtloader = new THREE.TextureLoader()
    let textures = txtloader.load("./weathermap/basemap/bluemarble.jpg");
    
    
    //ジオメトリの作成
    let ballgeometry = new THREE.SphereGeometry(100, 64, 32); //(r, nx, ny)r:半径, x,y方向の分割数
    
    //マテリアル
    let ballmaterial = new THREE.MeshPhysicalMaterial({map: textures});
    
    // メッシュ
    let ballmesh = new THREE.Mesh(ballgeometry, ballmaterial);
    
    //シーンにメッシュを追加
    scene.add(ballmesh);

    //地球よりちょっと大きめの球を作りそれに気圧面を貼り付ける
    let weather_geometry = new THREE.SphereGeometry(105, 64, 32);
    let weather_material = new THREE.MeshLambertMaterial( 
         {  
            map: txtloader.load("./weathermap/sfc/precip_pmsl/precip_pmsl_202408200000.png"),


            transparent: true,
            side: THREE.DoubleSide // 裏からも見えるようにする
         }
    )
    weather_mesh = new THREE.Mesh(weather_geometry, weather_material);
    scene.add(weather_mesh);


    
    //平衡光源
    let directionalLight = new THREE.DirectionalLight(0xffffff, 2); //color, strength
    directionalLight.position.set(1,1,1)
    scene.add(directionalLight)
    
    // ポイント光源
    pointLight = new THREE.PointLight(0xffffff,1);
    pointLight.position.set(-200,-200,-200);
    pointLight.decay=1;
    pointLight.power=1000;
    scene.add(pointLight);
    
    //ポイント光源の位置
    // let pointLightHelper = new THREE.PointLightHelper(pointLight, 30);
    // scene.add(pointLightHelper);
    
    //マウス操作
    controls = new OrbitControls(camera, renderer.domElement);

    window.addEventListener("resize", onWindowResize);
    document.getElementById("inputDate").addEventListener("change",updateSfcTexture);

    // 日付・日時・描画する図の種類のいずれかに変更があった場合にテキスチャを更新する
    document.getElementById("weatherData").addEventListener("change",updateSfcTexture);
    document.getElementById("weatherData2").addEventListener("change",updateSfcTexture);

    document.getElementById("inputDate").addEventListener("change",updateSfcTexture);
    document.getElementById("time-selector").addEventListener("change",updateSfcTexture);


    animate();
}

//ブラウザのリサイズに対応
function onWindowResize(){
    canvas.width = window.innerWidth * 0.8; // 画面幅の80%
    canvas.height = window.innerHeight;     // 画面高さ全体

    renderer.setSize(canvas.width, canvas.height);
    //カメラのアスペクト比の変更
    camera.aspect = canvas.width/canvas.height;
    camera.updateProjectionMatrix()

}

function updateSfcTexture(){
    var obsdate=document.getElementById("inputDate").value;
    var obstime = document.getElementById("time-selector").value;
    let elements = document.getElementsByName('weatherData');
    let len = elements.length;
    let weather_col = '';
    for (let i = 0; i < len; i++){
        if (elements.item(i).checked){
            weather_col = elements.item(i).value;
        }
    }


    var yyyymmddhhmm = obsdate.slice(0,4) + obsdate.slice(5,7) + obsdate.slice(8,10) + obstime 
    var figpath = "./weathermap/sfc/" + weather_col + "/"+weather_col+"_" + yyyymmddhhmm +".png"
    let textures = txtloader.load(figpath)
    let weather_material = new THREE.MeshLambertMaterial( 
         {  
            map: textures,
            transparent: true,
            side: THREE.DoubleSide // 裏からも見えるようにする
         }
    )
    console.log(figpath);
    weather_material.needsUpdate =true;
    weather_mesh.material = weather_material
    renderer.render(scene, camera);

}

function animate(){
    pointLight.position.set(
    200 * Math.sin(Date.now()/ 500),
    200 * Math.sin(Date.now()/ 1000),
    200 * Math.cos(Date.now()/ 500),
    );
    requestAnimationFrame(animate);
    //レンダリング
    renderer.render(scene, camera);
 }