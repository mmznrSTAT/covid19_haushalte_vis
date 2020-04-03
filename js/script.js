(function () {

	window.onload = function () {

	//Parameter
	const categories = 'INDIKATOR_NAME',
		values = 'INDIKATOR_VALUE',
		indikatorID = 133,
		mapYear = 2019,
		jahr = 2018,
		kanton = 'ZH',
		projectionZH = 2056;


  let productionBaseUrlData = 'https://www.web.statistik.zh.ch/cms_vis/Gemeinden_Gemeindeordnungen_Karte/';
  let productionBaseUrlMap = 'https://www.web.statistik.zh.ch/cms_vis/Ressources_Maps/'+mapYear;
  let dataPath = 'data/RevisionGODaten.csv',
  	mapPath = "data/GemeindeGrosseSeeOhneExklave_gen_epsg2056_F_KTZH_"+mapYear+".json";

	if (location.protocol !== "file:") {
		 dataPath = productionBaseUrlData+dataPath;
			mapPath = productionBaseUrlData+mapPath;
	}

	console.log(dataPath,mapPath);


	var projection = 0,
		padding = 0,
		path,
		scale=1;


	var margin = {top: 10, right: 10, bottom: 10, left: 10},
	  width = parseInt(d3.select('#map').style('width')) - margin.left - margin.right,
	  height = 650 - margin.top - margin.bottom;

	var transX = width/2;
	var svgSize = [width, height];
	var svgMap = d3.select('#map').style('margin-bottom',"3.5rem")
		.append('svg')
			.attr('id', 'svgMap')
			.attr('width', width)
			.attr('height', height)
			.attr('aria-labelledby','title')
			.attr('ariadescribedby', 'desc')
			.attr('role', 'img')
			.attr("transform", "translate(" + (margin.left) + "," +(margin.top) + ")");

	document.getElementById("map").parentNode.style.marginTop = "0px";
	document.getElementById("map").parentNode.parentNode.style.marginTop = "0px";
	svgMap.append('desc')
		.attr('desc', 'Interkative Karte des Kantons Zürich.')
		.attr('id', 'desc');

	var svgMapGr = svgMap.append('g').attr('id', 'svgMapGr');
	var legendeGr = svgMap.append('g').attr('id','legendeGr').attr('transform', 'translate('+(0)+','+(-20)+')scale('+scale+')');

	var mapPfade = d3.select('#svgMap').append('g').attr('id', 'mapPfade').attr('transform', 'translate('+(10)+','+(0)+')');

  var defs = d3.select('#svgMap').append("defs")


  //linearer Farbverlauf
	var filter = defs.append("filter")
	  .attr("id", "drop-shadow")
	  .attr("height", "130%");

	// SourceAlpha refers to opacity of graphic that this filter will be applied to
	// convolve that with a Gaussian with standard deviation 3 and store result
	// in blur
	filter.append("feGaussianBlur")
	  .attr("in", "SourceAlpha")
	  .attr("stdDeviation", 3)
	  .attr("result", "blur");

	// translate output of Gaussian blur to the right and downwards with 2px
	// store result in offsetBlur
	filter.append("feOffset")
	  .attr("in", "blur")
	  .attr("dx", 10)
	  .attr("dy", 10)
	.attr("result", "offsetBlur");

	var feMerge = filter.append("feMerge");

	feMerge.append("feMergeNode")
	  .attr("in", "offsetBlur")
	feMerge.append("feMergeNode")
		.attr("in", "SourceGraphic");


  var mainGradient = defs.append('linearGradient')
    .attr('id', 'mainGradient');

  // Create the stops of the main gradient. Each stop will be assigned
  // a class to style the stop using CSS.
  mainGradient.append('stop')
    .attr('class', 'stop-left')
    .attr('offset', '0');

  mainGradient.append('stop')
    .attr('class', 'stop-right')
    .attr('offset', '1');

	//Formatierung Schweiz
	var ch_DE = {
		"decimal": ".",
		"thousands": "'",
		"grouping": [3],
		"currency": ["CHF", " "],
		"dateTime": "%a %b %e %X %Y",
		"date": "%d.%m.%Y",
		"time": "%H:%M:%S",
		"periods": ["AM", "PM"],
		"days": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
		"shortDays": ["So", "Mo", "Di", "M", "Do", "Fr", "Sa"],
		"months": ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
		"shortMonths": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
	};
	d3.formatDefaultLocale(ch_DE);

	var scale = 1;

  var colorScale = d3.scaleOrdinal()
    .range(['rgb(62,167,67)','rgb(255,204,0)','lightgrey']);
    //.interpolate(d3.interpolateHsl);

	//Daten laden
	Promise.all([
		d3.dsv(';',dataPath),
		d3.json(mapPath)
	]).then(function(data) {
		var mapData = data[1];
		var gpData = data[0];
		console.log(gpData);

		colorScale
			.domain(['Vom Regierungsrat genehmigt','In Vorprüfung','Revision ausstehend'])

		//Combine Data
		for(i=0;i<mapData.features.length;i++) {
			var thisData = gpData.filter(function(el) {
				return el.bfs == mapData.features[i].properties.GDE_ID;
			})
			if(thisData.length>0) {
				mapData.features[i].properties.status =  thisData[0].status;
			} else {
				mapData.features[i].properties.status = 'Revision ausstehend';
			}

		}
		renderMap(mapData);
		colorMap(mapData,jahr);
		legende(colorScale)

	});

	function legende(farbskala) {
		var farbDataC = farbskala.domain(),
			farbDataT = farbskala.domain(),
			rectH = 20,
			rectW = 20;
			console.log(farbskala.domain());
			console.log(farbskala.range());

		var legRect = legendeGr.selectAll('rect.legende')
			.data(farbDataC);

		legRect.enter()
			.append('rect')
			.attr('class','legende')
			.attr('x', 0)
			.attr('y', (d,i) => (i+1)*20+2)
			.attr('height', rectH-2)
			.attr('width', rectW-2)
			.attr('fill', d => farbskala(d));

		legRect
			.attr('y', i => i*20)
			.attr('fill', d => farbskala(d));

		legRect.exit().remove();

		console.log(farbDataT)

		var legText = legendeGr.selectAll('text.legende')
			.data(farbDataT);

		legText.enter()
			.append('text')
			.attr('class','legende')
			.style('font-size', 14/scale+'px')
			.attr('x', 30)
			.attr('y', (d,i) => (i+1)*20+17)
			.text( d => d);

		legText
			.attr('y', i => i*20)
			.text(d => d)

		legText.exit().remove();
	}

	//Karte zeichnen
	function renderMap(data) {
		projection = d3
		  .geoIdentity()
		  .reflectY(true)
		  .fitExtent(
		    [[padding, padding], svgSize.map(d => d - padding)],
		    data
		  );
		console.log(svgSize);
		const path = d3.geoPath(projection);
		console.log(data);

		var paths = svgMapGr.append('g').attr('id', 'Gemeinden').selectAll(".gemeinde")
			.data(data.features)
			.enter()
			.append("path")
			.attr("id", function(d) { return 'map_'+d.properties.GDE_ID; })
			.attr('class', 'gemeinde')
			.attr("name", function(d) { return d.properties.GDE_N; })
			.attr("d", path)
			.style("cursor", "pointer")
			.attr('pointer-events', function(d) {
				if (d.properties.ART_N !='Gemeinde') {
					return 'none';
				}
			})
			.style('fill-opacity', function(d) {
				if (d.properties.ART_N == 'See') {
					return 1;
				} else {
					return 1;
				}
			})
			.style('stroke', function(d) {
				if (d.properties.ART_N != 'See') {
					return 'dimgrey';
				} else {
					//return 'url(#hash4_4)';
					return 'dimgrey';
				}
			})
      .classed('filled', true)
			.on("mouseover", function (d) {
				var gemMap = d3.select('#map_'+d.properties.GDE_ID);
				var dMap = gemMap.datum();
				mouseOver(dMap, gemMap, gemMap._groups[0][0].getBBox(), 'map');

				let bBoxSel = d3.select(this).node().getBBox();
			})
			.on('mouseout', function(d, i) {

				//d.getBBox();
				mouseOut();
			})
			.on("click", function (d) {
				dataSel = d;
				//pyramide(d, jahrSel,renderAusl,spiegel)
			});
			mapFit('gemeinde');
		}

		function mouseOver(thisData, that, bbox, flag) {
			var thisBfs = thisData.properties.GDE_ID;

			d3.select('#karte').selectAll('path.gemeinden')
				.style('fill-opacity', 0.3)
				.style('stroke-opacity', 0.3);

			var mouseOverRW = 217/scale,
				mouseOverRH = 48;
			//Position Tooltip
			var xPos = bbox.x+bbox.width/2,
				yPos = bbox.y+bbox.height/2;
			//Korrektur, damit tooltip nicht über den Rand hinaus geht:
			if (xPos>transX) {
				xPos = bbox.x+bbox.width/2-mouseOverRW
			}
			if (yPos>80) {
				yPos = bbox.y+bbox.height/2-mouseOverRH
			}
			var mouseOverL = mapPfade.append('g').attr('id', 'mouseOverL')
				.attr('pointer-events', 'none');

			var mouseOverP = mouseOverL.append('g')
				.attr('id','mouseOverP');
			var mouseOverT = mouseOverL.append('g')
				.attr('id','mouseOverT')
				.attr('transform', 'translate('+(xPos)+','+(yPos)+')');

			mouseOverP.append('path')
				.attr("class", 'mouse')
				.attr("d", that.attr('d'))
				.style('fill', 'none')
				.style('stroke', 'dimgrey')
				.style('stroke-width', 2);

			mouseOverT.append('rect')
				.attr('x', -5)
				.attr('y', 0)
				.attr('width', mouseOverRW)
				.attr('height', mouseOverRH)
				.style('fill', 'white')
				.attr('fill-opacity', 0.8)
				.style('stroke', 'dimgrey');

			mouseOverT.append('path')
				.attr("class", 'mouse')
				.attr("d", that.attr('d'))
				.style('fill', 'whitesmoke')
				.attr('transform', 'translate('+(-xPos)+','+(-yPos)+')');

			mouseOverT.append('text')
				.attr('x', 2/scale)
				.attr('y', 16/scale)
				.style('font-size', 14/scale+'px')
				.style('font-weight', 'bold')
				.text(thisData.properties.GDE_N)
				.style('font-family', 'Helvetica');

			mouseOverT.append('text')
				.attr('x', 2/scale)
				.attr('y', 16/scale)
				.attr('dy', '1.4em')
				.style('font-size', 14/scale+'px')
				.text(thisData.properties.status)
				.style('font-family', 'Helvetica');
		}

		function mouseOut() {
			d3.select('#mouseOverL').remove();
			d3.select('#mouseOverC').remove();

			d3.select('.Gemeinde').selectAll('path')
				.style('stroke-width', 0.5)
				.style('fill-opacity', 1)
				.style('stroke-opacity', 1);
		}

		function colorMap(data,jahr) {
			d3.selectAll('.gemeinde')
				.style('fill', function(d) {
					if(d.properties.ART_N != 'See') {
						return colorScale(d.properties.status);
						} else {
						//return 'url(#hash4_4)';
						return 'url(#mainGradient)';
					}
				})
		}

		//Karte an Grösse des Fensters anapssen
		function mapFit(klasse) {
			var xMin = d3.min(d3.selectAll('.'+klasse).nodes(), function(d) {
				return d.getBBox().x;
			});
			var xMax = d3.max(d3.selectAll('.'+klasse).nodes(), function(d) {
				return d.getBBox().x+d.getBBox().width;
			})
			var yMin = d3.min(d3.selectAll('.'+klasse).nodes(), function(d) {
				return d.getBBox().y;
			});
			var yMax = d3.max(d3.selectAll('.'+klasse).nodes(), function(d) {
				return d.getBBox().y+d.getBBox().height;
			})

			var fitObj = {};
			fitObj.scaleX = (width)/(xMax-xMin);
			fitObj.scaleY = (height)/(yMax-yMin);
			fitObj.scale = d3.min([fitObj.scaleX,fitObj.scaleY])

			var transX = (-xMin+10)*fitObj.scale;
			var transY = yMax*fitObj.scale;
			console.log(fitObj);
			console.log(yMax);
			var scale = fitObj.scale;
			var widthCalc = (xMax-xMin)*scale;
			var center = (width-widthCalc)/2;

			d3.selectAll('.gemeinde').style('stroke-width', function(d) {
				if (d.properties.ART_N != 'See') {
					return 0.1/scale;
				} else {
					//return 'url(#hash4_4)';
					return 1/scale;
				}
			});


			svgMapGr
				.attr("transform", "translate("+(transX+center/2)+","+(0)+")scale("+scale+")");

			mapPfade
				.attr("transform", "translate("+(transX+center/2)+","+(0)+")scale("+scale+")");

		}

	//Wenn Fenstergrösse verändert wird, Grösse der Visualisierung anpassen
	function resize() {
	  width = parseInt(d3.select('#map').style('width')) - margin.left - margin.right;
  	//height = parseInt(d3.select("#d3vis").style("height")) - margin.top - margin.bottom;
		d3.select('svg').attr('width', width);


		transX = (width+80)/2;
		mapFit('gemeinde');

		legendeGr.attr('transform', 'translate('+(0)+','+(-20)+')scale('+scale+')')
	}

	// Call the resize function whenever a resize event occurs
	d3.select(window).on('resize', resize);

	};
}());