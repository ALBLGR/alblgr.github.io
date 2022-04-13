
// http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png
var view = new ol.View({
    center: ol.proj.fromLonLat([114.1366, 22.2831]),
    zoom: 18,
    maxZoom: 20
  });

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      // This illustrates a custom tiles source but for using
      // official OpenStreetMap server new ol.source.OSM()
      // instead of new ol.source.XYZ(...) is enough
      source: new ol.source.XYZ({
        attributions: [
          'Map from Lands Department'
        ],
        url: 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/WGS84/{z}/{x}/{y}.png'
      })
    })
  ],
  controls: ol.control.defaults({
    // Set to display OSM attributions on the bottom right control
    attributionOptions: {
      collapsed: false
    }
  }).extend([
    new ol.control.ScaleLine() // Add scale line to the defaults controls
  ]),
  target: 'map',
  view: view
});


//geolocation --------
const geolocation = new ol.Geolocation({
  // enableHighAccuracy must be set to true to have the heading value.
  trackingOptions: {
    enableHighAccuracy: true,
  },
  projection: view.getProjection(),
});

geolocation.on('error', function (error) {
  alert(error.message);
  
});

const accuracyFeature = new ol.Feature();
geolocation.on('change:accuracyGeometry', function () {
  accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
});

accuracyFeature.set("geolocation",true);
const positionFeature = new ol.Feature();
positionFeature.setStyle(
  new ol.style.Style({
    image: new ol.style.Circle({
      radius: 6,
      fill: new ol.style.Fill({
        color: '#3399CC',
      }),
      stroke: new ol.style.Stroke({
        color: '#fff',
        width: 2,
      }),
    }),
  })
);

positionFeature.set("geolocation",true);

geolocation.on('change:position', function () {
  const coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
});

var geoSource = new ol.source.Vector({
    features: [accuracyFeature, positionFeature],
  });
// handle geolocation error.

map.addLayer(new ol.layer.Vector({
  source: geoSource
}));
//end geolocation

// Add vector layer with a feature and a style using an icon
var buildingSource;
var sourceVector;
var pathVector;


buildingPolygon();
drawPath();
featuresVector();


// Overlay to manage popup on the top of the map
var popup = document.getElementById('popup');
var overLay = new ol.Overlay({
  element: popup
});

map.addOverlay(overLay);

// Manage click on the map to display/hide popup
map.on('click', function(e) {
  var info = [];
  var coordinate = e.coordinate;
  clearCard();
  map.forEachFeatureAtPixel(e.pixel, function(feature) {
    if(feature.get("geolocation") == true){
      return;
    }
    if(feature.getGeometry().getType()== "Polygon"){
      console.log(feature)
      showCardBuilding(feature.get("name"),feature.get("marker-symbol"),feature.get("acronym"),
        "building/" +feature.get("image"),"assets/floorplan/"+feature.get("floorplan"), "Floor Plan");
        info.push(`<table class="table table-sm table-striped table-hover">
          <thead><tr><td>${feature.get("name")}<br><i class="caption">Building - ${feature.get("acronym")}</i></td>
          <td><button onclick="showModal('assets/floorplan/${feature.get("floorplan")}','${feature.get("name")}')" 
          class="btn btn-primary "><span class="oi oi-project" title="floor plan" aria-hidden="true"></span></button></td></tr></thead><tbody>
          <tr><td colspan="2"><img onclick="showModalImg('assets/building/${feature.get("image")}','${feature.get("name")}')"
          style="max-height:100px" class="mx-auto d-block" src="assets/building/${feature.get("image")}"/></td></tr>
          
          </tbody></table>
          `);
        return;
    }

    else if (feature.getGeometry().getType()== "Point") {
      showCardPOI(feature);
        info.push(`<table class="table table-sm table-striped table-hover">
          <thead><tr><td><img style="height:3em" 
          src="https://a.tiles.mapbox.com/v4/marker/pin-m-${feature.get("marker-symbol")}+${feature.get("marker-color").substr(1)}@2x.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXFhYTA2bTMyeW44ZG0ybXBkMHkifQ.gUGbDOPUN1v1fTs5SeOR4A">
          </td><td>${feature.get("name")}<br><i class="caption">${feature.get("category")} at Level ${feature.get("floor")?feature.get("floor"):""}</i></td>
          <td>
          ${feature.get("Menu")?`<button onclick="showModal('assets/menu/${feature.get("Menu")}','${feature.get("name")} Menu')" 
          class="btn btn-primary "><span class="oi oi-menu" title="menu" aria-hidden="true"></span></button>`:""}
          ${feature.get("Ordering/Booking")?`<td><button onclick="showModal('${feature.get("Ordering/Booking")}','${feature.get("name").replaceAll('\'', '')} Online Order')" 
          class="btn btn-primary "><span class="oi oi-browser" title="booking" aria-hidden="true"></span></button>`:""}
          ${feature.get("Contact")?`<td><button onclick="call('${feature.get("Contact")}')"
          class="btn btn-primary "><span class="oi oi-headphones" title="call" aria-hidden="true"></span></button>`:""}
          </td>
          </tr></thead><tbody>
          <tr><td colspan="4"><img onclick="showModalImg('assets/POIimg/${feature.get("image")}','${feature.get("name")}')"  style="max-height:100px" class="mx-auto d-block" src="assets/POIimg/${feature.get("image")}"/></td></tr>
          
          </tbody></table>
          `);
        return;

    }

    else if (feature.getGeometry().getType()== "LineString") {
        info.push(`<table class="table table-sm table-striped table-hover">
          <thead><tr><td>${feature.get("name")}<br><i class="caption">${feature.get("description")}</i></td>
          </tr></thead><tbody>
          <tr><td colspan="2"><img onclick="showModalImg('assets/path/${feature.get("name")}.jpg','${feature.get("name")}')"
          style="max-height:100px" class="mx-auto d-block" src="assets/path/${feature.get("name")}.jpg"/></td></tr>
          
          </tbody></table>
          `);
        return;
    }


    info.push(`<table class="table table-sm table-striped table-hover"><thead><tr>${feature.get("name")}</tr></thead>
      <tbody>` + feature.getKeys().slice(1).map((k, i) => {
      if(k=="url")
        return `<tr><th colspan="2"><a href="${feature.get(k)}" target="_blank" >Details</a></th></tr>`;
      return k=="name"||k=="img"?"":`<tr><th>${k}</th> <td>${feature.get(k)}</td></tr>`;
    }).join('') + '</tbody></table>');
  });
  if (info.length > 0) {
    popup.innerHTML = info.join('');
    popup.style.display = 'inline';
    overLay.setPosition(coordinate);
  } else {
    popup.innerHTML = '&nbsp;';
    popup.style.display = 'none';
  }
});


//Listener to vector source change
var listenerKey = sourceVector.on('change', function(e) {
  if (sourceVector.getState() == 'ready') {
    // hide loading icon
    // ...
    var typeList = [];

    for (i of sourceVector.getFeatures()) {
      if (i.get("marker-symbol"))
        typeList.push(i.get("category"));
    }

    typeList = [...new Set(typeList)];
    var navTypeItem = $('#navTypeItem')[0];
    for (i of typeList) {
      navTypeItem.innerHTML += `<button class="btn btn-outline-light btn-sm" onclick='showPanel("${i}")'>${i}</button>`;
    }

    ol.Observable.unByKey(listenerKey);

  }
});


function focusOnFeature(e) {
  $("#exampleModal").modal("toggle");
  let name = e
  var feature;
  for (i of sourceVector.getFeatures()) {
    if (i.get("name") == name) {
      feature = i;
      break;
    }
  }

  var coord = feature.getGeometry().getCoordinates();
  coord = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
  var lon = coord[0];
  var lat = coord[1];
  CenterMap(lon, lat);

  clearCard();
  showCardPOI(feature);


}

function searchBuilding() {
  var feature;
  for (i = 0; i < buildingSource.getFeatures().length; i++) {
    if (buildingSource.getFeatures()[i].get("acronym") == document.getElementById('acronym').value)
      feature = buildingSource.getFeatures()[i];
  }
  if(!feature){
     $("#alert")[0].innerHTML = `<div class="alert alert-danger alert-dismissible" role="alert"> 
     ${"Not Available"}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`
    return;
  }
  var coord = feature.getGeometry().getCoordinates();
  coord1 = ol.proj.transform(coord[0][0], 'EPSG:3857', 'EPSG:4326');
  var lon = coord1[0];
  var lat = coord1[1];
  CenterMap(lon, lat);
  clearCard();
  showCardBuilding(feature.get("name"),feature.get("marker-symbol"),feature.get("acronym"),
        "building/" +feature.get("image"),"assets/floorplan/"+feature.get("floorplan"), "Floor Plan");
}


function buildingPolygon() {
  buildingSource = new ol.source.Vector({
    url: 'building.json',
    format: new ol.format.GeoJSON()
  });

  var buildingLayer = new ol.layer.Vector({
    source: buildingSource,
    style: function(feature) {
      if (feature.get("name") == "Centennial Campus")
        color1 = 'rgba(150, 130, 29, 0.2)';
      else
        color1 = 'rgba(0, 255, 0, 0.45)';

      return new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgba(100, 100, 29, 1)',
          width: 2
        }),
        text: new ol.style.Text({
          text: feature.get("name"),
          scale: 1,
          overflow: true,
          fill: new ol.style.Fill({
            color: '#000000'
          }),
          stroke: new ol.style.Stroke({
            color: '#FFFF99',
            width: 1
          })
        }),
        fill: new ol.style.Fill({
          color: color1
        })
      })
    }
  });

  map.addLayer(buildingLayer);
};

function featuresVector() {
  sourceVector = new ol.source.Vector({
    url: 'POI.json',
    format: new ol.format.GeoJSON()
  });

  var vectorLayer = new ol.layer.Vector({
    source: sourceVector,
    style: function(feature) {

      imgAddr = `https://a.tiles.mapbox.com/v4/marker/pin-m-${feature.get("marker-symbol")}+${feature.get("marker-color").substr(1)}@2x.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXFhYTA2bTMyeW44ZG0ybXBkMHkifQ.gUGbDOPUN1v1fTs5SeOR4A`;

      return new ol.style.Style({

        image: new ol.style.Icon({
          anchor: [0.5, 46],
          anchorXUnits: 'fraction',
          anchorYUnits: 'pixels',
          src: imgAddr,
          scale: 0.5
        }),

      })
    }
  });

  map.addLayer(vectorLayer);
}


function drawPath() {
  pathSource = new ol.source.Vector({
    url: 'path.json',
    format: new ol.format.GeoJSON()
  });

  var pathLayer = new ol.layer.Vector({
    source: pathSource,
    style: function(feature) {
      let r = Math.round(feature.get("name").hashCode() % 142+100);
      let g = Math.round(Math.round(feature.get("name").hashCode()/327) % 42+100);
      let b = Math.round(Math.round(Math.round(feature.get("name").hashCode()/453)) % 155+100);
      return new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: `rgba(${r},${g},${b}, 0.8)`,
          width: 6,
          lineDash: [3,16],
        }),
        text: new ol.style.Text({
          text: feature.get("name"),
          scale: 1,
          overflow: true,
          fill: new ol.style.Fill({
            color: '#666666'
          }),
          stroke: new ol.style.Stroke({
            color: '#0066FF',
            width: 0.2,

          })
        }),
        fill: new ol.style.Fill({
          color: `rgba(${r},${g},${b}, 0.8)`
        })
      })
    }
  });

  map.addLayer(pathLayer);
};


function CenterMap(long, lat) {
  // console.log("Long: " + long + " Lat: " + lat);
  map.getView().setCenter(ol.proj.transform([long, lat], 'EPSG:4326', 'EPSG:3857'));
  map.getView().setZoom(18);

}

function copyright() {
  alert("Copyright Notice:\n\
Map from Lands Department\n\
Aerial Photograph from Lands Department\n\
Earth Image from NASA Earth Observatory\n\
Satellite Imagery from USGS/NASA Landsat\n\
\n\
Disclaimer Notice:\n\
The map information provided on this web site is protected by copyright owned by the Government of the Hong Kong\
 Special Administrative Region (the “Government”). No express or implied warranty is given to the accuracy or \
 completeness of such map information or its appropriateness for use in any particular circumstances. \
 The Government is not responsible for any loss or damage whatsoever arising from any cause in connection with\
 such map information or with this web site.");
}

String.prototype.hashCode = function(){
  //https://stackoverflow.com/questions/194846/is-there-any-kind-of-hash-code-function-in-javascript
    var hash = 0;
    for (var i = 0; i < this.length; i++) {
        var character = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+character;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}


function clearCard() {
  $("#card")[0].innerHTML = "";
}
function showCardBuilding(title,subtitle,body,img,detail,button){
  $("#card")[0].innerHTML += `<img onclick="showModalImg('assets/${img}')" src="assets/${img?img:"hku.jpg"}" class="card-img-top">
          <div class="card-body">
            <h5 class="card-title">${title}</h5>
            <h6 class="card-subtitle mb-2 text-muted">${subtitle?subtitle:""}</h6>
            <p class="card-text">${body?body:""}</p>
            <button onclick="showModal('${detail}','${title}')" class="btn btn-primary">${button}</button>
          </div>`;
}

function showCardPOI(feature){
  $("#card")[0].innerHTML += `<img onclick="showModalImg('assets/POIimg/${feature.get("image")}')" src="assets/POIimg/${feature.get("image")}" class="card-img-top">
          <div class="card-body">
            <h5 class="card-title">${feature.get("name")}</h5>
            <h6 class="card-subtitle mb-2 text-muted">${feature.get("category")}</h6>
            <p class="card-text">${""}</p>
             ${feature.get("Ordering/Booking")?`<button onclick='showModal(\"${feature.get('Ordering/Booking')}\", "Ordering")' class='btnAction btn btn-primary'>Order</button>`:""}
             ${feature.get("Menu")?`<button onclick='showModal(\"assets/menu/${feature.get('Menu')}\", "Menu")' class='btnAction btn btn-primary'>Menu</button>`:""}
             ${feature.get("Contact")?`<button onclick='call(\"${feature.get('Contact')}\")' class='btnAction btn btn-primary'>Call</button>`:""}
             </div>
            `;

}

function showModal(url,title){
  $("#exampleModalLabel")[0].innerHTML = title;
  $("#modalBody")[0].innerHTML = `<iframe style="width:100%;height: 550px;" src="${url}#toolbar=0"></iframe>`;

  $("#exampleModal").modal("toggle");
}

function showModalImg(img,title){
  $("#exampleModalLabel")[0].innerHTML = title;
  $("#modalBody")[0].innerHTML = `<img style="width:100%;max-height: 550px;" src="${img}"></img>`;

  $("#exampleModal").modal("toggle");
}

function call(tel){
  window.location.href=`tel://${tel}`;
}

function showPanel(cat){
  $("#exampleModalLabel")[0].innerHTML = cat;
  $("#modalBody")[0].innerHTML = '<div class="container"><div class="row" id="cardrow">';
  for (i of sourceVector.getFeatures()) {
        if (i.get("category") == cat) {
          $("#cardrow")[0].innerHTML += `
            <div class="card card-panel col-12 col-md-6 col-lg-4 col-sm-12 col-xs-12" onclick="focusOnFeature('${i.get('name')}')">
            <img src="assets/POIimg/${i.get("image")}" class="card-img-top" style="height:10rem;object-fit: cover;">
            <div class="card-body">
              <h5 class="card-title">${i.get("name")}</h5>
              <p class="card-text">Some quick example text.</p>
            </div>
          </div>`;
        }
    }
    $("#modalBody")[0].innerHTML +="</div></div>";
  

  $("#exampleModal").modal("toggle");
}

window.onresize = function()
{
  setTimeout( function() { map.updateSize();}, 200);
}