var elements={
	screen: document.getElementById("screen"),
	jscreen: document.getElementById("jscreen"),
	gradView: document.getElementById("gradView"),
	division: document.getElementById("division"),
	group: document.getElementById("group"),
	triggers: document.getElementsByClassName("triggers"),
	options: document.getElementsByClassName("options")
};

scr=elements.screen.getContext("2d",{alpha:false});
jscr=elements.jscreen.getContext("2d",{alpha:false});
view=elements.gradView.getContext("2d");

var mstate={
	name: 'm',
	xcor: 0,
	ycor: 0,
	zoom: 1,
	limit: 600,
	minVal: 0,
	context: scr,
	canvas: elements.screen,
	width:640,
	height: 640,
	valList: {},
	clickX: 0,
	clickY:0
};
var jstate={
	name: 'j',
	xcor: 0,
	ycor: 0,
	zoom: 1,
	limit: 600,
	minVal: 0,
	context:jscr,
	canvas: elements.jscreen,
	width:640,
	height: 640,
	valList:{},
	clickX: 0,
	clickY: 0
};
state=mstate;

var zoomChange=1;
var vwidth=Number(document.getElementById("gradView").width);

var input={
	element: function(id){
		return(document.getElementById(id));
	},
	value: function(id){
		var input=document.getElementById(id);
		if(input.type=="number"||input.type=="range"){
			return(Number(input.value));
		}else{
			return(input.value);
		}
	},
	set: function(id,val){
		document.getElementById(id).value=val;
	},
	sync: function(id1,id2){
		document.getElementById(id1).value=document.getElementById(id2).value;
	}
};

var color = {
	hexToArray: function(hex){
		var num=Number("0x"+hex.slice(1,7));
		return([Math.floor(num/65536),Math.floor(num/256)%256,num%256]);
	},
	arrayToRGB: function(array){
		return('rgb('+array.toString()+')');
	},
	arrayToHex: function(array){
		var hex=(array[0]*65536+array[1]*256+array[2]).toString(16);
		return('#'+'0'.repeat(6-hex.length)+hex);
	},
	num: 600,
	points: {
		0:[255,0,0],
		100:[255,255,0],
		200:[0,255,0],
		300:[0,255,255],
		400:[0,0,255],
		500:[255,0,255],
		599:[255,0,0]
	},
	getNearest: function(pos){
		var keys=this.keys;
		if(pos<=0){return(0);}
		else if(pos>=this.num-1){return(this.num-1);}
		for(var i=1; i<keys.length; i++){
			if(keys[i]>pos){
				if(pos-keys[i-1]<keys[i]-pos){return(i-1);}
				else{return(i);}
			}
		}
		return(0);
	},
	get keys(){return(Object.keys(this.points).map(p=>Number(p)).sort((a,b)=>Number(a)-Number(b)));},
	presets:{
		rainbow: {
			0:[255,0,0],
			100:[255,255,0],
			200:[0,255,0],
			300:[0,255,255],
			400:[0,0,255],
			500:[255,0,255],
			599:[255,0,0]
		},
		rgb: {
			0:[255,0,0],
			200:[0,255,0],
			400:[0,0,255],
			599:[255,0,0]
		},
		greyscale: {
			0:[30,30,30],
			300:[255,255,255],
			599:[30,30,30]
		},
		wrb: {
			0:[255,255,255],
			200:[30,30,30],
			300:[255,0,0],
			400:[30,30,30],
			599:[255,255,255]
		},
		ocean: {
			0:[0, 54, 208],
			100:[0, 174, 255],
			150:[255, 255, 255],
			200:[255, 223, 0],
			300:[36, 187, 0],
			400:[255, 223, 0],
			500:[0, 174, 255],
			599:[0, 54, 208]
		},
		larch: {
			0: [255,238,0],
			50: [255,205,0],
			150: [73,204,42],
			250: [226,255,0],
			300: [64,58,42],
			350: [226,255,0],
			450: [73,204,42],
			550: [255,205,0],
			600: [255,238,0]
		}
	},
	table: [],
	linearGradient: function(){
		var index=0;
		var keys=this.keys;
		var x1=keys[0];
		var x2=keys[1];
		var y1=this.points[x1];
		var y2=this.points[x2];
		var array=[0,0,0];
		this.table=[];
		for(var x=0; x<this.num; x++){
			if(x==keys[index+1]+1){
				index++;
				x1=x2;
				x2=keys[index+1];
				y1=this.points[x1];
				y2=this.points[x2];
			}
			for(var c=0; c<3; c++){
				array[c]=Math.round(((y2[c]-y1[c])*(x-x1)/(x2-x1))+y1[c]);
			}
			this.table.push(this.arrayToHex(array));
			
		}
	},
	cubicGradient: function(){
		var index=0;
		var keys=this.keys;
		var x1=keys[0];
		var x2=keys[1];
		var y1=this.points[x1];
		var y2=this.points[x2];
		var array=[0,0,0];
		this.table=[];
		var h=0;
		for(var x=0; x<this.num; x++){
			if(x==keys[index+1]+1){
				index++;
				x1=x2;
				x2=keys[index+1];
				y1=this.points[x1];
				y2=this.points[x2];
			}
			for(var c=0; c<3; c++){
				array[c]=Math.round((3*(y2[c]-y1[c])*((x-x1)/(x2-x1))**2)-(2*(y2[c]-y1[c])*((x-x1)/(x2-x1))**3)+y1[c]);
			}
			this.table.push(this.arrayToHex(array));
		}
	}
};

function changeSize(){
    state.width=Math.round(Number(document.getElementById("width").value));
    state.height=Math.round(Number(document.getElementById("height").value));
    state.canvas.width=state.width;
    state.canvas.height=state.height;
    state.valList={};
};

function details(){
	input.set("xcor",state.clickX);
	input.set("ycor",state.clickY);
	input.set("zoom",state.zoom);
	input.set("limit",state.limit);
	input.set("width",state.width);
	input.set("height",state.height);
}

function show(num,event=undefined){
	if(num<0){
		var tabs=document.getElementsByClassName("tab");
		if(num==-1){
			elements.screen.style.display='block';
			elements.jscreen.style.display='none';
			tabs[1].style.backgroundColor="#4363ff";
			tabs[0].style.backgroundColor="#ffc24c";
			state=mstate;
			document.getElementById("run").style.display="inline-block";
		}else if(num==-2){
			elements.screen.style.display='none';
			elements.jscreen.style.display='block';
			tabs[0].style.backgroundColor="#4363ff";
			tabs[1].style.backgroundColor="#ffc24c";
			state=jstate;
			document.getElementById("run").style.display="none";
		}
		details();
	}else{
		var divs=document.getElementsByClassName("options");
		var trigs=document.getElementsByClassName("trigger");
		for(x in trigs){
			if(x==num){
				divs[x].style="display:block";
				trigs[x].style="display:none";
			}else{
				divs[x].style="display:none";
				trigs[x].style="display:block";
			}
		}
	}
}

function changeZoom(a){
    if(a==0){
        document.getElementById('zoom').value/=document.getElementById('changeZoom').value;
    }else{
        document.getElementById('zoom').value*=document.getElementById('changeZoom').value;
    }
}

function changeCoords(event){
	var zoom=state.zoom;
	var xcor=state.xcor;
	var ycor=state.ycor;
    var clickX=Number(event.offsetX)-(state.width/2);
    var clickY=(state.height/2)-Number(event.offsetY);
    if(width<height){
        var newX=clickX/((zoom*(state.width/4)))+xcor;
        var newY=clickY/(zoom*(state.width/4))+ycor;
    }else{
        var newX=clickX/((zoom*(state.height/4)))+xcor;
        var newY=clickY/(zoom*(state.height/4))+ycor;
    }
    document.getElementById('xcor').value=newX;
    document.getElementById('ycor').value=newY;
	state.clickX=newX;
	state.clickY=newY;
}

function draw(array=state.valList,drawState=state,context=state.context,start=-2,direction=colorState.dir){
	if(start==-2){
		start=(colorState.dir==1?drawState.minVal:state.limit);
	}
	if(start==-1){return;}
	var next=-1;
	var num=color.num;
	var val=0;
	var count=0;
	var colorBegin=colorState.colorBegin;
	var colorStep=colorState.colorStep;
	var relCol=colorState.relCol;
	var pixNum=colorState.pixNum;
	var inSetColor=colorState.inSetColor;
	if(direction==-1){
		for(val=start; val>=drawState.minVal; val--){
			if(count>=pixNum){
				next=val;
				break;
			}
			if(array[val].length==0){
				continue;
			}
			if(val==drawState.limit){
				context.strokeStyle=inSetColor;
			}else if(relCol){
				context.strokeStyle=color.table[(((val-drawState.minVal)*colorStep+colorBegin)%num+num)%num];
			}else{
				context.strokeStyle=color.table[((val*colorStep+colorBegin)%num+num)%num];
			}
			context.beginPath()
			for(var co of array[val]){
				context.moveTo(co[0]+0.5,co[1]);
				context.lineTo(co[0]+0.5,co[1]+1);
				count++;
			}
			context.stroke();
		}
	}else{
		for(val=start; val<=drawState.limit; val++){
			if(count>=pixNum){
				next=val;
				break;
			}
			if(array[val].length==0){
				continue;
			}
			if(val==drawState.limit){
				context.strokeStyle=inSetColor;
			}else if(relCol){
				context.strokeStyle=color.table[(((val-drawState.minVal)*colorStep+colorBegin)%num+num)%num];
			}else{
				context.strokeStyle=color.table[((val*colorStep+colorBegin)%num+num)%num];
			}
			context.beginPath()
			for(var co of array[val]){
				context.moveTo(co[0]+0.5,co[1]);
				context.lineTo(co[0]+0.5,co[1]+1);
				count++;
			}
			context.stroke();
		}
	}
	if(next!=-1){
		setTimeout(draw,0,array,drawState,context,next,direction);
	}
}

function fill(val){
	scr.beginPath();
	for(var co of valList[val]){
		scr.moveTo(co[0]+0.5,co[1]);
		scr.lineTo(co[0]+0.5,co[1]+1);
	}
	scr.strokeStyle="white";
	scr.stroke();
}

function restore(val){
	scr.beginPath();
	var num=color.num;
	for(var co of valList[val]){
		scr.moveTo(co[0]+0.5,co[1]);
		scr.lineTo(co[0]+0.5,co[1]+1);
	}
	scr.strokeStyle=color.table[(((val-minVal)*colorState.colorStep+colorState.colorBegin)%num+num)%num];
	scr.stroke();
}

function animate(val=minVal){
	if(val-5>=minVal){
		setTimeout(restore,0,val-5);
	}
	if(val<limit){
		setTimeout(fill,0,val);
	}
	if(val>=limit+4){
		return;
	}
	setTimeout(animate,0,val+1);
}

var colorState={
	colorBegin: 0,
	colorStep: 10,
	inSetColor: "#000000",
	pixNum: 500,
	speedChange: function(){
		var speed=input.value("speed");
		if(speed==1000){
			this.pixNum=width*height;
		}else{
			this.pixNum=speed;
		}
	},
	autoChange: true,
	relCol: true,
	dir: 1,
	changeVisuals: function(bypass=false){
		this.colorBegin=input.value("colorBegin");
		this.colorStep=input.value("colorStep");
		this.inSetColor=input.value("inSetColor");
		this.relCol=document.getElementById("relCol").checked;
		this.dir=Number(input.value("dir"));
		if(Object.keys(state.valList).length!=0&&(document.getElementById("autoChange").checked||bypass)){
			setTimeout(draw,0);
		}
	},
	currentPoint: 0,
	position: 0
};

function updateGradPos(pointNum){
	var pos=color.keys[pointNum];
	input.set("pointPos",pos);
	input.set("slider",pos);
	input.set("pointColor",color.arrayToHex(color.points[pos]));
	colorState.currentPoint=pointNum;
	colorState.position=pos;
}

function moveGradPoint(index,newPos){
	var keys=color.keys;
	var array=color.points[keys[index]];
	delete color.points[keys[index]];
	color.points[newPos]=array;
	var pointNum=color.keys.indexOf(newPos);
	input.set("pointNum",pointNum);
	colorState.position=newPos;
	colorState.currentPoint=pointNum;
}

function updateGrad(action,event=undefined){
	var num=color.num;
	var keys=color.keys;
	
	//Handle Edits:	
	if(action=='change'){
		var pointNum=input.value("pointNum");
		if(pointNum>=keys.length||pointNum<0){
			input.set("pointNum",keys.length-1);
			updateGradPos(keys.length-1);
		}else{
			updateGradPos(pointNum);
		}
		return;
	}
	else if(action=='changeSlider'){
		var pointNum=colorState.currentPoint;
		var pointPos=input.value("pointPos");
		if(pointPos>=0&&pointPos<num&&pointNum!=0&&pointNum!=keys.length-1){
			input.set("slider",pointPos);
			moveGradPoint(pointNum,pointPos);
		}else{
			input.set("pointPos",pointPos);
			return;
		}
	}
	else if(action=='changePos'){
		var pointNum=colorState.currentPoint;
		var pointPos=input.value("slider");
		if(pointNum!=0&&pointNum!=keys.length-1){
			input.set("pointPos",pointPos);
			moveGradPoint(pointNum,pointPos);
		}else{
			input.set("slider",colorState.position);
			return;
		}
	}
	else if(action=="changeCol"){
		var pointNum=colorState.currentPoint;
		var pointColor=input.value("pointColor");
		color.points[keys[pointNum]]=color.hexToArray(pointColor);
	}
	else if(action=="click"){
		var pos=Number(event.offsetX*num/vwidth)
		if(event.ctrlKey){
			var pointColor=input.value("pointColor");
			color.points[pos]=color.hexToArray(String(pointColor));
			keys=color.keys;
			var pointNum=keys.indexOf(pos);
			updateGradPos(pointNum);
		}else if(event.shiftKey){
			input.set("colorBegin",pos);
			colorState.colorBegin=pos;
		}else{
			var pointNum=color.getNearest(pos);
			input.set("pointNum",pointNum);
			updateGradPos(pointNum);
			return;
		}
	}
	else if(action=="delete"){
		var pointNum=colorState.currentPoint;
		if(pointNum==0||pointNum==keys.length-1){return;}
		delete color.points[keys[pointNum]];
		updateGradPos(pointNum);
	}
	else if(action=="resize"){
		var pointNum=colorState.currentPoint;
		gradSize=Math.round(input.value("gradSize"));
		if(gradSize<1){
			input.set("gradSize",color.num);
			return;
		}
		input.set("gradSize",gradSize);
		color.num=gradSize;
		var newPoints={};
		for(var x=0; x<keys.length-1; x++){
			var pos=keys[x];
			newPoints[Math.round(pos*gradSize/num)]=color.points[pos];
		}
		array=color.points[num-1];
		newPoints[gradSize-1]=array;
		color.points=newPoints;
		
		num=color.num;
		input.element('slider').max=num-1;
		updateGradPos(pointNum);
	}
	else if(action=="presets"){
		input.set("pointNum",0);
		var preset=input.value("presets");
		if(preset!="none"){
			color.num=600;
			num=600;
			input.set("gradSize",600);
			color.points=color.presets[preset];
			updateGradPos(0);
			input.element('slider').max=599;
		}else{
			return;
		}
	}
	
	//Create Gradient:
	gradType=input.value("gradType");
	if(gradType=='linear'){
		color.linearGradient();
	}else{
		color.cubicGradient();
	}
	
	//Preview Window:
	view.fillStyle='black';
	view.fillRect(0,0,vwidth,14);
	for(var x=0; x<num; x++){
		if(x in color.points){
			view.fillStyle='white';
			view.fillRect(x*vwidth/num-1,0,2,2);
			view.fillRect(x*vwidth/num-1,12,2,2);
		}
		if(x==(colorState.colorBegin%color.num)){
			view.fillStyle='green';
			view.fillRect(x*vwidth/num-1,0,2,2);
			view.fillRect(x*vwidth/num-1,12,2,2);
		}
		view.fillStyle=color.table[x];
		view.fillRect(x*vwidth/num,2,vwidth/num,10);
	}
	
	//Draw:
	if(Object.keys(state.valList).length!=0&&document.getElementById("autoChange").checked){
		setTimeout(draw,0);
	}
}

function displayNum(event){
	var x=Math.round(event.offsetX*color.num/vwidth);
	elements.gradView.title=x;
}

function disable(bool){
	var button=document.getElementById('run');
	var jbutton=document.getElementById('jrun');
	if(bool){
		elements.screen.style.cursor='wait';
		elements.jscreen.style.cursor='wait';
	}else{
		elements.screen.style.cursor='crosshair';
		elements.jscreen.style.cursor='crosshair';
	}
	button.disabled=bool;
	jbutton.disabled=bool;
};

function julia(x,y,m,n){
	var workingm=m;
	var workingn=n;
	var oldworkingm=m
	var m2,n2;
	for(h=0; h<jstate.limit-1; h++){
		m2=workingm**2;
		n2=workingn**2;
		if(m2+n2>4){
			return(h);
		}
		workingm=(m2-n2)+x;
		workingn=(2*oldworkingm*workingn)+y;
		/*workingm=-1*(workingm**3-3*workingm*(workingn**2)-workingm**2+workingn**2+m);
            workingn=-1*(3*(workingm**2)*workingn-workingn**3-2*workingm*workingn+n);*/
		oldworkingm=workingm;
	}
	if((workingm**2)+(workingn**2)>4){
		return(h);
	}
	return(jstate.limit);
}

function inset(m,n){
	var workingm=m;
	var workingn=n;
	var oldworkingm=m
	var m2,n2;
	for(h=0; h<mstate.limit-1; h++){
		m2=workingm**2;
		n2=workingn**2;
		if(m2+n2>4){
			return(h);
		}
		workingm=(m2-n2)+m;
		workingn=(2*oldworkingm*workingn)+n;
		/*workingm=-1*(workingm**3-3*workingm*(workingn**2)-workingm**2+workingn**2+m);
            workingn=-1*(3*(workingm**2)*workingn-workingn**3-2*workingm*workingn+n);*/
		oldworkingm=workingm;
	}
	if((workingm**2)+(workingn**2)>4){
		return(h);
	}
	return(mstate.limit);
}

/*function squared3([m,n]){
	return([3*(m**2-n**2),6*m*n]);
}

function cubedm1([m,n]){
	return([m**3-3*m*(n**2)-1,3*(m**2)*n-n**3]);
}

function divide([m,n],[o,p]){
	var con=o**2+p**2;
	return([(m*o+n*p)/con,(n*o-m*p)/con]);
}

function minus([m,n],[o,p]){
	return([m-o,n-p]);
}

function newton(m,n){
	var h;
	var value=[m,n];
	for(h=0; h<mstate.limit; h++){
		value=minus(value,divide(cubedm1(value),squared3(value)));
	}
	if(value[0]>0){
		var grad=value[1]/value[0];
		if(grad<-1.732050808){
			return(2);
		}else if(grad<1.732050808){
			return(0);
		}else{
			return(1);
		}
	}else{
		if(value[1]>0){
			return(1);
		}else{
			return(2);
		}
	}
}*/

function run(){
	mstate.xcor=Number(document.getElementById("xcor").value);
	mstate.ycor=Number(document.getElementById("ycor").value);
	mstate.zoom=Number(document.getElementById("zoom").value);
	mstate.limit=Number(document.getElementById("limit").value);
	mstate.clickX=mstate.xcor;
	mstate.clickY=mstate.ycor;
	var width=mstate.width;
	var height=mstate.height;
	
    //console.log("start");
	for(var i=0; i<mstate.limit+1; i++){
		mstate.valList[i]=[];
	}
	mstate.minVal=Infinity;
	var a,b,value;
	var x,y;
	if(width<height){
		var rad=width/2;
	}else{
		var rad=height/2;
	}
    for(x=0; x<width; x++){
        for(y=0; y<height; y++){
            a=((2*x-width))/(mstate.zoom*rad)+mstate.xcor;
            b=((height-2*y))/(mstate.zoom*rad)+mstate.ycor;
            value=inset(a,b);
			if(value<mstate.minVal){mstate.minVal=value;}
            mstate.valList[value].push([x,y]);
        }
    }
    //console.log('done list');
	
    draw(mstate.valList,mstate,scr);
	disable(false);
    /*var png=scree.toDataURL('image/png');
    console.log(png);
    document.getElementById('download').href=png;*/
    //console.log("done");
}

function jrun(){
	if(state.name=='j'){
		jstate.xcor=Number(document.getElementById("xcor").value);
		jstate.ycor=Number(document.getElementById("ycor").value);
		jstate.zoom=Number(document.getElementById("zoom").value);
		jstate.limit=Number(document.getElementById("limit").value);
	}
	var width=jstate.width;
	var height=jstate.height;
	
    //console.log("start");
	for(var i=0; i<jstate.limit+1; i++){
		jstate.valList[i]=[];
	}
	jstate.minVal=Infinity;
	var a,b,value;
	var x,y;
	if(width<height){
		var rad=width/2;
	}else{
		var rad=height/2;
	}
    for(x=0; x<width; x++){
        for(y=0; y<height; y++){
            a=((2*x-width))/(jstate.zoom*rad)+jstate.xcor;
            b=((height-2*y))/(jstate.zoom*rad)+jstate.ycor;
            value=julia(mstate.clickX,mstate.clickY,a,b);
			if(value<jstate.minVal){jstate.minVal=value;}
            jstate.valList[value].push([x,y]);
        }
    }
	console.log(x,y);
    //console.log('done list');
	
    draw(jstate.valList,jstate,jscr);
	disable(false);
}

function qrun(){
	xcor=Number(document.getElementById("xcor").value);
    ycor=Number(document.getElementById("ycor").value);
	jcor=Number(document.getElementById("jcor").value);
	kcor=Number(document.getElementById("kcor").value);
    zoom=Number(document.getElementById("zoom").value);
    limit=Number(document.getElementById("limit").value);
    
    function qinset(m,n){
        var workingm=0;
        var workingn=0;
		var workingj=0;
		var workingk=0;
        var oldworkingm=0;
        for(h=0; h<limit; h++){
            workingm=(workingm**2)-(workingn**2)-(workingj**2)-(workingk**2)+m;
            workingn=(2*oldworkingm*workingn)+n;
			workingj=(2*oldworkingm*workingj)+jcor;
			workingk=(2*oldworkingm*workingk)+kcor;
            oldworkingm=workingm;
            if((workingm**2)+(workingn**2)+(workingj**2)+(workingk**2)>4){
                return(h);
            }
        }
        return(h);
    }
	var width=mstate.width;
	var height=mstate.height;
	if(width<height){
		var rad=width/2;
	}else{
		var rad=height/2;
	}
	
    //console.log("start");
	for(var i=0; i<mstate.limit+1; i++){
		mstate.valList[i]=[];
	}
    for(x=0; x<width; x++){
        for(y=0; y<height; y++){
            a=((2*x-width))/(mstate.zoom*rad)+mstate.xcor;
            b=((height-2*y))/(mstate.zoom*rad)+mstate.ycor;
            value=qinset(a,b);
			if(value<mstate.minVal){mstate.minVal=value;}
            mstate.valList[value].push([x,y]);
        }
    }
    //console.log('done list');
    draw(mstate.valList,mstate,scr);
	disable(false);
    /*var png=scree.toDataURL('image/png');
    console.log(png);
    document.getElementById('download').href=png;*/
    //console.log("done");
}

changeSize();
show(1);
show(-1);
updateGrad("change");
updateGrad("presets");
updateGrad("none");
colorState.changeVisuals();
//setTimeout(run,0);
