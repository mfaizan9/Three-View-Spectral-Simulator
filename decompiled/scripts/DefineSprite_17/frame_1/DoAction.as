function setTelescopePosition(tx, ty)
{
   var _loc3_ = this;
   var startTimer = getTimer();
   var pL = _loc3_.pointsList;
   var n = 50;
   var step = 1 / n;
   var minD2 = Infinity;
   var _loc1_ = {};
   var x0 = _loc3_.startPoint.x;
   var y0 = _loc3_.startPoint.y;
   var i = 0;
   while(i < pL.length)
   {
      var x1 = pL[i].cx;
      var y1 = pL[i].cy;
      var x2 = pL[i].ax;
      var y2 = pL[i].ay;
      var minD2ThisArc = Infinity;
      var minPtThisArc = {};
      var j = 0;
      while(j <= n)
      {
         var t = j * step;
         var k0 = (1 - t) * (1 - t);
         var k1 = 2 * t * (1 - t);
         var k2 = t * t;
         var x = k0 * x0 + k1 * x1 + k2 * x2;
         var y = k0 * y0 + k1 * y1 + k2 * y2;
         var dx = tx - x;
         var dy = ty - y;
         var d2 = dx * dx + dy * dy;
         if(d2 < minD2ThisArc)
         {
            minD2ThisArc = d2;
            minPtThisArc = {i:i,t:t,x:x,y:y};
         }
         j++;
      }
      if(minD2ThisArc < minD2)
      {
         minD2 = minD2ThisArc;
         _loc1_ = minPtThisArc;
         var t = _loc1_.t - step;
         var k0 = (1 - t) * (1 - t);
         var k1 = 2 * t * (1 - t);
         var k2 = t * t;
         var xb = k0 * x0 + k1 * x1 + k2 * x2;
         var yb = k0 * y0 + k1 * y1 + k2 * y2;
         var t = _loc1_.t + step;
         var k0 = (1 - t) * (1 - t);
         var k1 = 2 * t * (1 - t);
         var k2 = t * t;
         var xa = k0 * x0 + k1 * x1 + k2 * x2;
         var ya = k0 * y0 + k1 * y1 + k2 * y2;
         _loc1_.rot = 90 + 57.29577951308232 * Math.atan2(ya - yb,xa - xb);
      }
      x0 = x2;
      y0 = y2;
      i++;
   }
   _loc3_.ghostTelescopeMC._x = _loc1_.x;
   _loc3_.ghostTelescopeMC._y = _loc1_.y;
   _loc3_.ghostTelescopeMC._rotation = _loc1_.rot;
   var snapPts = [{i:0,t:0.6,x:53.136,y:-45.992,rot:-6.19883731350571},{i:2,t:0.96,x:225.72464,y:-236.64864,rot:82.4780349239495},{i:5,t:0.32,x:411.8968,y:-226.5096,rot:80.0958167870263}];
   var snapR = 40;
   var snapR2 = snapR * snapR;
   var i = 0;
   var _loc2_;
   while(i < snapPts.length)
   {
      var snapPt = snapPts[i];
      var dx = _loc1_.x - snapPt.x;
      var dy = _loc1_.y - snapPt.y;
      if(dx * dx + dy * dy < snapR2)
      {
         _loc1_ = snapPt;
         _loc3_.telescopeMC._x = _loc1_.x;
         _loc3_.telescopeMC._y = _loc1_.y;
         _loc3_.telescopeMC._rotation = _loc1_.rot;
         var fallOffFraction = 3.5;
         var x = _loc3_.cloudParams.x - _loc1_.x;
         var y = _loc3_.cloudParams.y - _loc1_.y;
         var d = Math.sqrt(x * x + y * y);
         var saw = _loc3_.cloudParams.r / d;
         if(saw > 1)
         {
            saw = 1;
         }
         var angularWidth = 57.29577951308232 * Math.asin(saw);
         var pointingAngle = Math.abs(_loc1_.rot - 57.29577951308232 * Math.atan2(y,x));
         var mc = 3 * (1 - pointingAngle / angularWidth);
         if(mc > 1)
         {
            mc = 1;
         }
         else if(mc < 0)
         {
            mc = 0;
         }
         var x = _loc3_.bulbParams.x - _loc1_.x;
         var y = _loc3_.bulbParams.y - _loc1_.y;
         var d = Math.sqrt(x * x + y * y);
         var saw = _loc3_.bulbParams.r / d;
         if(saw > 1)
         {
            saw = 1;
         }
         var angularWidth = 57.29577951308232 * Math.asin(saw);
         var pointingAngle = Math.abs(_loc1_.rot - 57.29577951308232 * Math.atan2(y,x));
         _loc2_ = 3 * (1 - pointingAngle / angularWidth);
         if(_loc2_ > 1)
         {
            _loc2_ = 1;
         }
         else if(_loc2_ < 0)
         {
            _loc2_ = 0;
         }
         var cI;
         var eI;
         var aI;
         if(_loc2_ > 0 && mc == 0)
         {
            cI = _loc2_;
            eI = 0;
            aI = 0;
         }
         else if(mc > 0 && _loc2_ == 0)
         {
            eI = mc;
            cI = 0;
            aI = 0;
         }
         else if(_loc2_ > 0 && mc > 0)
         {
            if(_loc2_ == 1)
            {
               cI = 0;
               eI = 0;
               aI = 1;
            }
            else
            {
               aI = _loc2_;
               eI = 1 - _loc2_;
            }
         }
         else
         {
            cI = eI = aI = 0;
         }
         _loc3_._parent.setIntensities(cI,eI,aI);
         break;
      }
      i++;
   }
}
startPoint = {x:69,y:7};
pointsList = [{cx:47.2,cy:-38.6,ax:54,ay:-79.4},{cx:63.4,cy:-135.8,ax:101.9,ay:-175.8},{cx:153,cy:-228.9,ax:232,ay:-237.4},{cx:279.4,cy:-242.5,ax:334,ay:-214.2},{cx:358.6,cy:-201.3,ax:377.9,ay:-213.3},{cx:428.7,cy:-244.9,ax:494,ay:-208}];
cloudParams = {r:58,x:246,y:-60};
bulbParams = {r:36,x:438,y:-90};
setTelescopePosition(226,-237);
ghostTelescopeMC._alpha = 0;
