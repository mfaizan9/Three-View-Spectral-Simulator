function TelescopeClass()
{
}
var p = TelescopeClass.prototype = new MovieClip();
Object.registerClass("Telescope",TelescopeClass);
p.onPress = function()
{
   var _loc1_ = this;
   _loc1_._parent.ghostTelescopeMC._alpha = 30;
   _loc1_._parent.ghostTelescopeMC._x = _loc1_._x;
   _loc1_._parent.ghostTelescopeMC._y = _loc1_._y;
   _loc1_._parent.ghostTelescopeMC._rotation = _loc1_._rotation;
   _loc1_.onMouseMove = _loc1_.onMouseMoveFunc;
};
p.onMouseMoveFunc = function()
{
   var _loc1_ = this;
   _loc1_._parent.setTelescopePosition(_loc1_._parent._xmouse,_loc1_._parent._ymouse);
   updateAfterEvent();
};
p.onRelease = p.onReleaseOutside = function()
{
   this._parent.ghostTelescopeMC._alpha = 0;
   delete this.onMouseMove;
};
