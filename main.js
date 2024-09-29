import * as THREE from "./build/three.module.js";
import { OrbitControls } from "./jsm/OrbitControls.js";

let scene, camera, renderer, pointLight, controls, canvas, txtloader, weather_mesh;
let weather_material, weather_plev_material, weather_plev_mesh;

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
    camera.position.set(0,0,+120);
    
    
    renderer = new THREE.WebGLRenderer({alpha: true, canvas });
    renderer.setSize(canvas.width, canvas.height);
    renderer.setPixelRatio(window.devicePixelRatio);
    txtloader = new THREE.TextureLoader()
    let textures = txtloader.load("./weathermap/basemap/bluemarble.jpg");
    textures.minFilter = THREE.LinearFilter;
    textures.maxFilter = THREE.LinearFilter;
    //textures.generateMipmaps = false;
    
    //ジオメトリの作成
    let ballgeometry = new THREE.SphereGeometry(40, 64, 32); //(r, nx, ny)r:半径, x,y方向の分割数
    
    //マテリアル
    let ballmaterial = new THREE.MeshPhysicalMaterial({map: textures});
    
    // メッシュ
    let ballmesh = new THREE.Mesh(ballgeometry, ballmaterial);
    
    //シーンにメッシュを追加
    scene.add(ballmesh);

    //地球よりちょっと大きめの球を作りそれに気圧面を貼り付ける
    let weather_geometry = new THREE.SphereGeometry(41, 64, 32);
    weather_material = new THREE.MeshLambertMaterial( 
         {  
            map: txtloader.load("./weathermap/sfc/precip_pmsl/precip_pmsl_202408200000.png"),
            transparent: true,
            side: THREE.DoubleSide // 裏からも見えるようにする
         }
    )
    weather_mesh = new THREE.Mesh(weather_geometry, weather_material);
    scene.add(weather_mesh);

    //  等圧面
    let weather_plev_geom = new THREE.SphereGeometry(45, 64, 32);
    weather_plev_material = new THREE.MeshLambertMaterial( 
         {  
            map: txtloader.load("./weathermap/500hPa/z_wind/z_wind_202408200000.png"),
            transparent: true,
            side: THREE.DoubleSide // 裏からも見えるようにする
         }
    )
    weather_plev_mesh = new THREE.Mesh(weather_plev_geom, weather_plev_material);
    scene.add(weather_plev_mesh);


    //平衡光源
    let directionalLight = new THREE.DirectionalLight(0xffffff, 2); //color, strength
    directionalLight.position.set(1,1,1)
    scene.add(directionalLight)
    
    // ポイント光源
    pointLight = new THREE.PointLight(0xffffff,1);
    pointLight.position.set(-100,-100,-100);
    pointLight.decay=1;
    pointLight.power=1000;
    scene.add(pointLight);
    
    //ポイント光源の位置
    // let pointLightHelper = new THREE.PointLightHelper(pointLight, 30);
    // scene.add(pointLightHelper);
    
    //マウス操作
    controls = new OrbitControls(camera, renderer.domElement);

    // 地表
    window.addEventListener("resize", onWindowResize);
    document.getElementById("inputDate").addEventListener("change",updateSfcTexture);

    // 日付・日時・描画する図の種類のいずれかに変更があった場合にテキスチャを更新する
    document.getElementById("weatherData").addEventListener("change",updateSfcTexture);
    document.getElementById("weatherData2").addEventListener("change",updateSfcTexture);

    document.getElementById("inputDate").addEventListener("change",updateSfcTexture);
    document.getElementById("time-selector").addEventListener("change",updateSfcTexture);
    
    // 等圧面
    document.getElementById("inputDate").addEventListener("change",updatePlevTexture);

    // 日付・日時・描画する図の種類のいずれかに変更があった場合にテキスチャを更新する
    document.getElementById("plevData1").addEventListener("change",updatePlevTexture);
    document.getElementById("plevData2").addEventListener("change",updatePlevTexture);
    document.getElementById("plevData3").addEventListener("change",updatePlevTexture);

    document.getElementById("inputDate").addEventListener("change",updatePlevTexture);
    document.getElementById("time-selector").addEventListener("change",updatePlevTexture);
    document.getElementById("pressure-selector").addEventListener("change",updatePlevTexture);
        
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
    weather_mesh.material.map = textures;
    weather_mesh.material.needsUpdate=true;
    renderer.render(scene, camera);
}

function updatePlevTexture(){
    var obsdate=document.getElementById("inputDate").value;
    var obstime = document.getElementById("time-selector").value;
    var plev = document.getElementById("pressure-selector").value;
    let elements = document.getElementsByName('plevData');

    let len = elements.length;
    let weather_col = '';
    for (let i = 0; i < len; i++){
        if (elements.item(i).checked){
            weather_col = elements.item(i).value;
        }
    }
    if (weather_col=="none"){
        // マテリアルのテクスチャを削除
        weather_plev_mesh.material.map = null;
        weather_plev_mesh.material.transparent = true;
        // マテリアルを更新
        weather_plev_mesh.material.needsUpdate = true;
        renderer.render(scene, camera)
        return 0
    }

    var yyyymmddhhmm = obsdate.slice(0,4) + obsdate.slice(5,7) + obsdate.slice(8,10) + obstime 
    var figpath = "./weathermap/"+plev+"/" + weather_col + "/"+weather_col+"_" +plev+"_"+ yyyymmddhhmm +".png"
    let textures = txtloader.load(figpath)
    weather_plev_mesh.material.map = textures;
    weather_plev_mesh.material.needsUpdate =true;
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