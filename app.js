/*
 * Content tool by Tung Pham
 */

// set up SVG for D3
var width  = '100%',
    height = 1000,
    colors = d3.scale.category10();
 
var r = 20;

/** @constructor */
function node(obj) {
  this.id = obj.id;
  this.x = obj.x;
  this.y = obj.y;
  this.content = obj.content;
};

/** @constructor */
function link(obj) {
  this.id = obj.id;
  this.src = obj.src;
  this.dest = obj.dest;
  this.label = obj.label;
  this.left = obj.left;
  this.right = obj.right;
}

var nodes = [new node({id: 1, x: 50, y: 50, content: 'content of node 1'}), new node({id: 2, x: 100, y: 100, content: 'content of node 2'})];
var links = [new link({id: '1-2', src: nodes[0], dest: nodes[1], label: 'START', left: false, right: true})];

var maxid = nodes.length; 
var ismousedown = false;
var selected_link = null; 
var isdone = false;
var ismouseovernode = false;
var selected_node = nodes[0]; 

var svg = d3.select('body').append('svg')
  .attr('width', width)
  .attr('height', height)
  .on('mousemove', function () {  
    if(ismousedown) {              
      drag_line.classed('hidden', false);       
      drag_line.attr('d', 'M' + selected_node.x + ',' + selected_node.y + 'L' + (d3.mouse(this)[0]) + ',' + (d3.mouse(this)[1]));    
    }
  })
  .on('mouseup', function () {
    ismousedown = false;
    drag_line.classed('hidden', true);
  })
  .on('dblclick', function (d) {       
    if(!ismouseovernode) {
      var point = d3.mouse(this);    
      var newid = ++maxid;
      var _node = new node({id: newid, x: point[0], y: point[1], content: ('this is the content of node ' + newid)});
      selected_node = _node;
      selected_link = null;
      nodes.push(_node);
      draw();
    }
  })
  ;

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');
 
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

function update() {
  var newvalue = document.getElementById('content').value;  
  if(selected_node) {
    var idx = nodes.indexOf(selected_node);
    nodes[idx].content = newvalue;
  } else {
    var idx = links.indexOf(selected_link);
    links[idx].label = newvalue;
    document.getElementById(selected_link.id).textContent = newvalue;
  }    
}

function save () {
  var data = [];

  nodes.map(function (node) {
    data.push(JSON.stringify(node));    
    data.push('\n');
  });

  links.map(function (l) {
    data.push(JSON.stringify(l));    
    data.push('\n');
  });

  var blob = new Blob(data, {type: "text/plain;charset=utf-8"});
  saveAs(blob, "test2.txt");
}

function load(evt) {
  
  var f = evt.files[0];  

  if(f) {
    
    var reader = new FileReader();  
    reader.readAsText(f);       

    reader.onload = function(e) {            
      
      nodes.length = 0, links.length = 0;
      draw();
      
      var contents = e.target.result;          
      var lines = contents.split('\n').filter(function(l) { return l.length > 0; });

      lines.map(function (line) {
        var obj = JSON.parse(line);    
        if(Object.keys(obj).length === 4) {
          nodes.push(new node(obj));
        } else {
          links.push(new link(obj));
        }
      });
      
      draw();      
    };  

  } else {
    console.log("fail to load file");
  }    
}

function removenode (node) { 
  nodes = nodes.filter(function (d) { return d != node; })
  links = links.filter(function (d) { return d.src != node && d.dest != node; })
}

function removelink (link) {  
  links = links.filter(function (d) { return d != link; })
}

function exist (id) {
  var len = links.length;
  for(var idx=0; idx<len; idx++) {
    if(links[idx].id === id)
      return true;
  }
  return false;
}

function getd (src, dest) { 
  var dx = dest.x - src.x;
  var dy = dest.y - src.y;
  var dist = Math.sqrt(dx*dx + dy*dy);
  var nx = dx/dist, ny = dy/dist;
  return 'M' + (src.x + r*nx) + ',' + (src.y + r*ny) + 'L' + (dest.x - r*nx) + ',' + (dest.y - r*ny);
}

function keyup() {
  d3.event.preventDefault();  

  if(!selected_node && !selected_link) return;
  switch(d3.event.keyCode) {
    case 46: // delete
      if(selected_node) {
        if(confirm('delete node ' + selected_node.id + '?')) {          
          removenode(selected_node);          
          selected_node = null;
          draw();
        }
      } else if (selected_link) {
        if(confirm('delete link ' + selected_link.id + '?')) {
          removelink(selected_link);
          selected_link = null;
          draw();          
        }
      } 
      break;
    case 17:
      circle.on('mousedown.drag',false);      
      createPaths([]);
      createPaths(links);
      break;         
    default:
      break;          
  }
}

function keydown() {
  if(!selected_node) return;

  if(d3.event.keyCode === 17) {
    circle.call(drag);     
  }
}

var drag = d3.behavior.drag()
    .on('drag', function (d,i) {
        d.x += d3.event.dx;
        d.y += d3.event.dy; 
        d3.select(this).attr("transform", function (d, i) {
            return "translate(" + [d.x,d.y] + ")";
        });  
        
    });

var circle = svg.append('svg:g').selectAll('circle');
var path = svg.append('svg:g').selectAll('path');

function createPaths(_links) {
  path = path.data(_links, function (d) { return d.id; })  

  var p = path.enter().append('svg:g');

  p.append('svg:path')
    .attr('class', 'link')    
    .attr('d', function (d) { return getd(d.src, d.dest); })
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
    .on('click', function (d) {      
      selected_link = d;     
      selected_node = null;      
      document.getElementById('content').value = d.label;
      d3.selectAll('path').classed('selected', function (d) {
        return d === selected_link;
      });
    })
    ;

  p.append('svg:text')
        .attr('id', function(d) {return d.id;})
        .attr('class', 'id')
        .attr("transform", function(d) { return "translate(" + [(d.src.x+d.dest.x)/2,(d.src.y+d.dest.y)/2] + ")"; })   
        .attr('x', 20)
        .text(function (d) { return d.label; })        
        ;  

  path.exit().remove();
}

// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0');

function createNodes () {       

  circle = circle.data(nodes, function(d) { return d.id; });

  circle.classed('reflexive', function(d) {return d === selected_node;})

  var g = circle.enter().append('svg:g')
            .attr("transform", function(d) { return "translate(" + [d.x,d.y] + ")"; })   
            .on('mousedown', function (d) {
              selected_node = d;  
              selected_link = null;
              ismousedown = true;                                      
              drag_line.style('marker-end', 'url(#end-arrow)');
              isdone = false;     
              console.log('current node now is ' + selected_node.id);            
              d3.selectAll('circle').classed('reflexive', function (d) {
                return d === selected_node;
              });                                       

              document.getElementById('content').value = selected_node.content;              

            })
            .on('mouseover', function (d) {        
              ismouseovernode = true;      
              if(selected_node && selected_node != d && ismousedown && !isdone) {                      
                drag_line.style('marker-end', 'url(#end-arrow)');  
                
                var key = selected_node.id + '-' + d.id;
                if(!exist(key)) {
                  drag_line.classed('hidden', true);
                  isdone = true;
                  var _link = new link({id: key, src: selected_node, dest: d, label: 'YES', left: false, right: true});
                  links.push(_link);
                  selected_link = _link; 
                  draw();
                }

                console.log(links);
              } else {                
                drag_line.style('marker-start', 'url(#start-arrow)');                
              }
            })
            .on('mouseout', function () {
              ismouseovernode = false;
            })
            ;               

  g.append('svg:circle').attr('r', r)
    .attr('class', 'node')    
    .style('fill', function(d) { return d3.rgb(colors(d.id)).brighter().toString(); })
    .style('stroke', function(d) { return d3.rgb(colors(d.id)).darker().toString(); })    
    ;
   
  g.append('svg:text')
    .attr('y', function (d) { return 4; })
    .attr('class', 'id')
    .text(function(d) { return d.id; })
    ;

  //remove deleted nodes  
  circle.exit().remove();
}

function draw() {  
  createNodes(); 
  createPaths(links); 
}

//app start here
d3.select(window).on('keyup', keyup).on('keydown', keydown);
draw();
 
