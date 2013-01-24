// ==UserScript==
// @name           ImpScanner
// @namespace      http://blogpagliaccio.wordpress.com
// @description    find planet, comets and debris in imperion
// @include        http://*.imperion.*/map*
// @grant GM_registerMenuCommand
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_listValues
// @grant GM_openInTab
// @grant GM_deleteValue
// @require        https://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js
// @require        http://userscripts.org/scripts/source/85398.user.js
// @version 1.337
// ==/UserScript==
// +++++++++++++++++++++++++++++++++++++++++++estract data info***********************************************
console.log('start...');
var bgColor = "071726";
try {
    var user=null;
  var sysid=0;
	function got(name, value) {
		console.log('got global named', name, 'with value', value);
		user=value.options.id;
		sysid=parseInt(user/100);
		console.log('user value "',user,'" sid value "',sysid,'"');
	}
	read_content_global('planet', got);
	console.log('create finder');
    var finder={
        // init
        k:0, b:0,
		production:new Array("","Very Low","Low","Medium","High","Very High"),
		preload : new Array(),
		sid:sysid,
		planet:new Array(),
        planetPrem:new Array(),
		bonus:new Object(),
        premCount: 0,
		typesort:new Array(),
		flagbar:false,
        	// ******************************************estract map info***********
		mapinfo : function () {
			$.ajax({
				url : "/map/index/preload/",
				data : "systemId=" + finder.sid + "&planetId="	+ user,
				type : "post",
				dataType : "json",
				success : function(data) {
					//************data of system is on object with type==1
					n=0;
					do {
						pr = data[n];
						n++;
					}
					while(pr.type!=1);
					pr = pr.data;
					i=0;
					//************ insert a key of every planet nearby selected system
					for ( var key in pr) {
						finder.preload[i]= key;
						i++
					}
					finder.findC();
				},
				error : function(e,s,c) {
					alert('call: '+this.data+' status :'+s);
				}
			});
		},
		menufind : function () {
			finder.sid=prompt("Enter the id of the system (the id of the planets without the last 2 digits)",sysid);
			if (finder.sid) finder.mapinfo();
		},
		findC:function () {
            //Setup the area 
			j = 0; finder.k=0; finder.b=0;
			$('#area2').css({top:'50%',left:'50%',margin:'-'+($('#area2').height() / 2)+'px 0 0 -'+($('#area2').width() / 2)+'px'});
            $('#area2').css({'background-color' : '#' + bgColor, 'border-radius' : '15px', 'color': '#64abeb'});
            document.getElementById("area2").style.background="background-image: url('http://nonnattiness.zxq.net/img/bg1.png') no-repeat";
			$('#area2').show();	$('#close').show();
			$('#close').text('Exit');
            
            //Set the background image
            var bgImg = new Image;
			bgImg.src = "http://nonnattiness.zxq.net/img/bg1.png";
            $('#area2').css('background-image', bgImg.src);
            
            var worthyPlanet = 0;
			for (i = 0; i < finder.preload.length; i++) {
				// search on system
				$.ajax({
					url : "/map/index/system/",
					data : "systemId=" + finder.preload[i] + "&planetId="+ user,
					type : "post",
					dataType : "json",
					success : function(data) {
						//************data of system is on object with type==1
						n=0;
						do {
							d = data[n];
							n++;
						}
						while(d.type!=1);
						vect=d.data.planets;
						for (var key in vect ) {
							finder.planet[finder.k]=new Array();
							finder.planet[finder.k].id=vect[key].id_planet;
							finder.planet[finder.k].name=vect[key].name;
							//***insert a production***************
							if (typeof(vect[key].map_info.production) == "undefined") finder.planet[finder.k].prod=0;
							else
								finder.planet[finder.k].prod=vect[key].map_info.production.box_count;
							finder.planet[finder.k].bonus=new Array();
							for (a=0;a<5;a++) {
							// find a bonus
                                
								type=vect[key].map_info.bonuses[a].bonusType;
								value=vect[key].map_info.bonuses[a].value;
								caption=vect[key].map_info.bonuses[a].caption;
								finder.planet[finder.k].bonus[type]=value;
								//add bonus to the list if not present
								finder.bonus[type]=caption; 
                                //Check if a worthy planet 
                                if(worthyPlanet == 1){
                                    finder.planet[finder.premCount].bonus[type]=value;
                                }
								//Check if already worthy, if not setup
                                else if(((caption == 'Wind power' || caption == 'Solar power' || caption == 'Thermal power' ||  caption == 'Hydro power') && value > 98) || 
                                      (caption == 'Research' && value >= 50) || (caption == 'Ship production speed' && value >= 114) || (caption == 'Population Growth' && value >= 60)){
                                    worthyPlanet = 1;
                                    finder.planetPrem[finder.premCount]=new Array();
                                    finder.planetPrem[finder.premCount].id=vect[key].id_planet;
                                    finder.planetPrem[finder.premCount].name=vect[key].name;
                                    finder.planetPrem[finder.premCount].bonus=new Array();
                                    //Load missing data
                                    for(var i=0; i<=a; i++){
                                        type=vect[key].map_info.bonuses[i].bonusType;
                                        value=vect[key].map_info.bonuses[i].value;
                                        finder.planetPrem[finder.premCount].bonus[type]=value;
                                    }
                                }
                               
							}
                            if(worthyPlanet == 1){
                                finder.premCount++;
                                worthyPlanet = 0;
                            }
							finder.k++;
						}
						j++;
						if (j >= finder.preload.length) finder.end();
						else {
							// 100:x=preload.length:j
							p=100*j/finder.preload.length;
							$('#area2').html("loading..."+parseInt(p)+"%");
						}
					},
					error : function(e,s,c) {
						/*alert('call: '+this.data+' status :'+s+ 'scan continue but it is incomplete');*/
						j++;
						if (j >= finder.preload.length) finder.end();
							else {
							// 100:x=preload.length:j
							p=100*j/finder.preload.length;
							$('#area2').html("loading..."+parseInt(p)+"%");
						}
					}
				});
			}
		},
		end : function () {
			//alert(finder.typesort);
			finder.planet.sort(sortplanet);
            
			text='';check='';
			//if (!finder.flagbar) {
				text='<link media="all" type="text/css" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.13/themes/base/jquery-ui.css" rel="stylesheet">'+
				'<div><div id="header" style="position:absolute; top: 10px; left: 20px;">Sort by:<button id="all"> All </button><button id="production"> Production </button></div>';
				          
            text += '<BR>Number Premium Planets: '+ finder.premCount +'<button id="checkPrem">Check</button><br><div id="sortByTypes" style="position:relative; width:780px; height:85px">'; 
            var linecountX = 0;
            var linecountY = 0;
            console.log('typesort',finder.typesort,' bonus ',finder.bonus); 
				for (var key in finder.bonus) {
					if (jQuery.inArray(key,finder.typesort)>=0) check='checked="true"';
					else check="";
					if(finder.bonus[key] == '???'){
						continue;
					}
                    text+= '<div id="sortType" style="position:absolute; top:' + (linecountY * 20) + 'px; left:'+ (linecountX * 250 + 50) + 'px;">';
                    text+= '<input '+check+' type="checkbox" id="'+key+'" value="'+key+'" /><label for="'+key+'">&nbsp&nbsp'+finder.bonus[key]+'</label></div>';
                    linecountX = linecountX + 1;
                    if(linecountX > 2){
                        linecountX = 0;
                        linecountY++;
                    }
				}
				text+='</div></div><BR>';
			text+='<table width="750"><tr><th>Name</th> <th>Production<BR>Rate</th> <th> Wind<BR>Energy </th> <th> Solar<BR>Energy </th> <th> Thermal<BR>Energy </th> <th>Bonus 1</th> <th>Bonus 2</th> </tr>';
			for (var key in finder.planet) {
				text+='<tr><td><a href="/map/index/index/stage/ORB/targetPlanetId/'+finder.planet[key].id+'" style="color:white;">'+finder.planet[key].name+'</a></td><td> '+finder.production[finder.planet[key].prod]+' </td>';
				for (var ke in finder.planet[key].bonus) {
					bon=finder.planet[key].bonus[ke];
					if(finder.bonus[ke] == 'Wind power' || finder.bonus[ke] == 'Solar power' ||finder.bonus[ke] == 'Thermal power'){
						text+= '<td><span style="color:'+(bon<0 ? "red" : "green" )+';">'+bon+'%</span></td>';
					}else {
						text+= '<td>'+finder.bonus[ke]+ ':<span style="color:'+"blue"+';">'+bon+'%</span></td>';
					}
				}
				text+='</tr>';
			}
			text+='</table>';
			$('#close').html("close");
			$('#area2').html(text);
			$("#all").click(function() {
				$('#sortType input').attr('checked',"");
				finder.typesort=new Array();
				finder.typesort[0]="all";
				finder.end();
			});
			$("#production").click(function() {
				$('#sortType input').attr('checked',"");
				finder.typesort=new Array();
				finder.typesort[0]="prod";
				finder.end();
			});
			$('#sortType input[type="checkbox"]').click(function() {
					finder.typesort=new Array();
					check=$('#sortType input:checked');
					for(k=0;check.eq(k).val();k++ ) {
						finder.typesort.push(check.eq(k).val());
					}
					finder.end();
				});
		}
    };
    finder.typesort[0]="all";
	console.log('create scan');
    
    
	var scan={
		sid : sysid,
		max : {id:0,val:0},
		preload:new Array(),
		j:0,
		comet:new Array(),
		debris:new Array(),
		menuscan : function () {
			scan.sid=prompt("Enter the id of the system (the id of the planets without the last 2 digits)",sysid);
			scan.max.id=0;
			scan.max.val=0;
			if (scan.sid) scan.mapinfo();
		},
		mapinfo : function () {
			$.ajax({
				url : "/map/index/preload/",
				data : "systemId=" + scan.sid + "&planetId="	+ user,
				type : "post",
				dataType : "json",
				success : function(data) {
					//************data of sistem is on object with tipe==1
					n=0;
					do {
						pr = data[n];
						n++;
					}
					while(pr.type!=1);
					pr = pr.data;
					i=0;
					//************ insert a key of evry planet nearby selected sistem
					for ( var key in pr) {
						scan.preload[i]= key;
						i++
					}
					scan.scan();
				},
				error : function(e,s,c) {
					alert('call: '+this.data+' status :'+s);
				}
			});
		},
		scan : function() {
			scan.j = 0;
			$('#area_comet').css({top:'50%',left:'50%',margin:'-'+($('#area2').height() / 2)+'px 0 0 -'+($('#area2').width() / 2)+'px'});
            $('#area_comet').css({'background-color' : '#' + bgColor, 'border-radius' : '15px', 'color': '#64abeb'});
			$('#area_comet').show();
			$('#area_comet').html("loading...");
			$('#close_comet').show();
			$('#close_comet').text("wait");
			for (i = 0; i < scan.preload.length; i++) {
				$.ajax({
					url : "/map/index/system/",
					data : "systemId=" + scan.preload[i] + "&planetId="+ user,
					type : "post",
					dataType : "json",
					success : function(data) {
						if ((typeof (data[0].data.comets) != 'undefined') && (data[0].data.comets != '')) {
							for ( var key in data[0].data.comets) {
								value = data[0].data.comets[key];
								tot = value.crystal * 1 + value.metal * 1+ value.tritium * 1;
								temp= new Object;
								temp.sysid=data[0].data.id_system;
								temp.id=key;
                                temp.slots= value.slots;
								temp.totres=tot;
								temp.res=new Array();
								temp.res=[value.metal,value.crystal,value.tritium];
								scan.comet.push(temp);
								if (scan.max.val<tot) {
									scan.max.id=key;
									scan.max.val=tot;
								}
							}
							// preload.length : j = 100 : perc
							perc=parseInt(scan.j*100/scan.preload.length);
							$('#area_comet').html('loading...'+perc+'%');
						}
						for(var key in data[0].data.planets)
						{
							if (typeof(data[0].data.planets[key].debris) != 'undefined') {
								value=data[0].data.planets[key].debris;
								temp= new Object;
								temp.planetId=key;
								temp.res=new Array();
								temp.res=[value.metal,value.crystal,value.tritium];
								temp.tot=value.crystal * 1 + value.metal * 1+ value.tritium * 1;
								scan.debris.push(temp);
							}
						}
					scan.j++;
					if (scan.j >= scan.preload.length) scan.end();
					},
					error : function(e,s,c) {
						alert('call: '+this.data+' status :'+s+' scan continue but it is incomplete');
						scan.j++;
						if (scan.j >= scan.preload.length) scan.end();
					}
				});
			}
		},
		end : function() {
            //Sort by total res found
            scan.comet.sort(function(a,b){return b.totres - a.totres});
            scan.debris.sort(function(a,b){return b.tot - a.tot});
            
            
			text='Comets <br> <br><br><table id="commet"width="750"><tr><th>Comets</th> <th>Slots Taken</th> <th>Total Res</th>  <th> Metal </th> <th> Crystal </th> <th> Tritium </th> </tr>';
			for(var key in scan.comet) {
                var slotNum = "TODO";
				if (scan.comet[key].res[0] == 0) mColor = 'red'; else mColor = 'orange';
				if (scan.comet[key].res[1] == 0) cColor = 'red'; else cColor = 'green';
				if (scan.comet[key].res[2] == 0) tColor = 'red'; else tColor = 'blue';
                //   if (scan.comet[key].slots != null) slotNum = scan.comet[key].slots.length;
                //Add , to numbers
                var formatNum = scan.comet[key].totres.toString();
                if(formatNum.length > 6){
                    scan.comet[key].totres = formatNum.substr(0,formatNum.length - 6) + ',' + formatNum.substr(formatNum.length - 6, 3) + ',' + formatNum.substr(formatNum.length - 3);
                }
                else if(formatNum.toString().length > 3){
                    scan.comet[key].totres = formatNum.substr(0, formatNum.length - 3) + ','+ formatNum.substr(formatNum.length - 3);
                }
                for(var i = 0 ; i < 3; i++){
                    formatNum = scan.comet[key].res[i].toString();
                    if(formatNum.length > 6){
                        scan.comet[key].res[i] = formatNum.substr(0,formatNum.length - 6) + ',' + formatNum.substr(formatNum.length - 6, 3) + ',' + formatNum.substr(formatNum.length - 3);
                    }
                    else if(formatNum.toString().length > 3){
                        scan.comet[key].res[i] = formatNum.substr(0, formatNum.length - 3) + ','+ formatNum.substr(formatNum.length - 3);
                    }
                }
               text+= '<tr><td><a style="color:white;" href="/map/index/index/stage/ORB/targetCometId/'+scan.comet[key].id+'" target="_blanc" style="color:black;text-decoration: underline;">'+ scan.comet[key].id +'</a></td>' +
                  '<td> '+ slotNum +' </td>' +
                   '<td>'+ scan.comet[key].totres+ '</td><td><div style="color:'+ mColor +';">'+ scan.comet[key].res[0] + 
                   '</div></td><td><div style="color:'+ cColor +';">'+ scan.comet[key].res[1] + '</div></td><td><div style="color:'+ tColor +';">'+ scan.comet[key].res[2] + '</div></td></tr>';
			}
            text += '</table><br><br>';
            if(scan.debris.length == 0){
                 text+='<br> No Debris Fields Detected';
            }
            else{
                text+='Debris Fields<br><table id="debris" width="750"><tr><th>Debris</th> <th>Total Res</th> <th> Metal </th> <th> Crystal </th> <th> Tritium </th> </tr>';
                for(var key in scan.debris) {
                    if (scan.debris[key].res[0] == 0) mColor = 'red'; else mColor = 'orange';
                    if (scan.debris[key].res[1] == 0) cColor = 'red'; else cColor = 'green';
                    if (scan.debris[key].res[2] == 0) tColor = 'red'; else tColor = 'blue';
                   text+= '<tr><td><a style="color:white;" href="/map/index/index/stage/ORB/targetPlanetId/'+ scan.debris[key].planetId +'" target="_blanc" style="color:black;text-decoration: underline;">'+ scan.debris[key].planetId +'</a></td>' +
                       '<td>'+ scan.debris[key].tot + '</td><td><div style="color:'+ mColor +';">'+ scan.debris[key].res[0] + 
                       '</div></td><td><div style="color:'+ cColor +';">'+ scan.debris[key].res[1] + '</div></td><td><div style="color:'+ tColor +';">'+ scan.debris[key].res[2] + '</div></td></tr>';
                      // value=scan.debris[key];
                      //  text+=' on planet:<a  target="_blanc" style="color:black;text-decoration: underline;" href="/map/index/index/stage/ORB/targetPlanetId/'+value.planetId+'">'+value.planetId+'</a> resources:<span style="color:blue;" title="m '+value.res[0]+' c '+value.res[1]+' t '+value.res[2]+'">'+value.tot+'</span> ';
                    }
            }
            text += '</table>';
			$('#area_comet').html(text);
			$('#close_comet').html("close");
			$("#savelink").click(function() {
				save='[';
				for (var key in scan.comet) {
					save+='{"id":'+scan.comet[key].id+',"totres":'+scan.comet[key].totres+',"res":['+scan.comet[key].res[0]+','+scan.comet[key].res[1]+','+scan.comet[key].res[2]+'],"sysid":'+scan.comet[key].sysid+'},';
				}
				save=save.substr(0,save.length-1);
				save+=']';
				auto=GM_getValue("autosave",1);
				name=prompt("save name?","auto_"+auto);
				if (name=="auto_"+auto) {
					auto++;
					GM_setValue("autosave",auto);
				}
				GM_setValue("comet_save_"+name,save);
				save='this is a code for export data on other pc <br/>'+save;
				$('#area_comet').html(save);
				$('#close_comet').html("close");
				$('#area_comet').show();
				$('#close_comet').show();
			});
		}
	};
    //Add image
    $('body').append('<div style="position: absolute; top: 0px; left: 95px; z-index: 1000;"><image src="http://nonnattiness.zxq.net/img/fc.jpg" height="100px" width="100px"> </image></div>');
    //interface buttons
	console.log('Create iButtons');
	$('body').append('<button id="scan" style="top: 5px; left: 200px; position: absolute; z-index: 1001;">Scan Comet/Debris</button>');
	$('#scan').click(scan.menuscan);
    $("#Imperion-Template-InterfaceMapShowLegend").click(function (){scan.sid=sysid;scan.mapinfo();});
    $('body').append('<button id="find" style="top: 5px; left: 5px; position: absolute; z-index: 1001;">Search Planets</button>');
	$('#find').click(finder.menufind);
    //Comet Text Area
	$('body').append('<div id="area_comet" style="display:none;top: 200px; left: 250px; width: 800px; border: 1px solid black; height: 500px; position: absolute; z-index: 1000; overflow: auto; background: none repeat scroll 0% 0% white;">this system have a comet:\n</div>');
	$('body').append('<button id="close_comet" style="display:none;width: 100px; height: 40px; top: 150px; left: 900px; position: absolute; z-index: 1001;">wait</button>');
	$('#close_comet').click(function() {
		$('#area_comet').hide();
		$('#close_comet').hide();
	});
    //Planet Text Area
    $('body').append('<div id="area2" style="display:none;top: 100px; left: 250; width: 800px; border: 1px solid black; height: 500px; position: absolute; z-index: 1000; overflow: auto; background: none repeat scroll 0% 0% white;">please  wait</div>');
	$('body').append('<button id="close" style="display:none;top: 160px; left: 900px; position: absolute; z-index: 1001;">wait</button>');
	$('#close').click(function() {
		$('#area2').hide();
		$('#close').hide();
	});
	//Function to send data for map
	
	console.log('Send data for map');
	$.post("http://nonnattiness.zxq.net/Reaperion/dataMap.php", { name: "John", time: "2pm" } );
    //Function used to sort planets
    function sortplanet(a,b) {
		if (finder.typesort.length==1) {
			switch (finder.typesort[0]) {
				case "all": maxa=0;
					for (var key in a.bonus) {
						maxa=maxa*1+parseInt(a.bonus[key]);
					}
					maxb=0;
					for (var key in b.bonus) {
						maxb=maxb*1+parseInt(b.bonus[key]);
					}
					r=maxb-maxa;
				break;
				case "prod" :
					r=b.prod-a.prod;
				break;
				default : if (typeof(b.bonus[finder.typesort[0]]) == "undefined") b2=-100; else b2=Math.abs(b.bonus[finder.typesort[0]]);
					if (typeof(a.bonus[finder.typesort[0]]) == "undefined") a2=-100; else a2=Math.abs(a.bonus[finder.typesort[0]]);
					r=b2-a2;
				break;
			}
		}
		else {
			a2=0;
			b2=0;
			for (var k in finder.typesort) {
				if (typeof(b.bonus[finder.typesort[k]]) == "undefined") b2-=100;
				else {
					if ((finder.typesort[k]=="buildingEnergyConsumption")||(finder.typesort[k]==9)||(finder.typesort[k]==12))
						b2-=b.bonus[finder.typesort[k]];
					else
						b2+=b.bonus[finder.typesort[k]];
				}
				if (typeof(a.bonus[finder.typesort[k]]) == "undefined") a2-=100;
				else {
					if ((finder.typesort[k]=="buildingEnergyConsumption")||(finder.typesort[k]==9)||(finder.typesort[k]==12))
						a2-=a.bonus[finder.typesort[k]];
					else a2+=a.bonus[finder.typesort[k]];
				}
			}
			r=b2-a2;
		}
		return r;
	}
}
catch(e) {
	//alert(e);
}
