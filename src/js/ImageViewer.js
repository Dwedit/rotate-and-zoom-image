class ImageViewer {

	constructor() {
		this.htmlElement = null;
		this.bodyElement = null;
		this.divElement = null;
		this.imgElement = null;
		
		this.selectedRotation = 0;
		this.selectedZoom = 1.0;
		this.xFlip = 0;
		this.yFlip = 0;
		
		this.zoomState = 0;
	}
	
	rotateImage(degrees) {
		this.Init();
		this.selectedRotation += degrees;
		if (this.selectedRotation >= 360)
		{
			this.selectedRotation -= 360;
		}
		if (this.selectedRotation < 0)
		{
			this.selectedRotation += 360;
		}
		this.UpdateSize();
	}
	
	zoomImage(percent) {
		this.Init();
		this.selectedZoom *= (percent / 100);
		this.UpdateSize();
	}
	
	flipImage(sx, sy) {
		this.Init();
		if (sx == -1)
		{
			this.xFlip ^= 1;
		}
		if (sy == -1)
		{
			this.yFlip ^= 1;
		}
		this.UpdateSize();
	}
	
	resetTransformation(transformation) {
		this.Init();
		if (transformation == "rotate")
		{
			this.selectedRotation = 0;
		}
		if (transformation == "scale")
		{
			this.xFlip = 0;
			this.yFlip = 0;
			this.selectedZoom = 1.0;
		}
		this.UpdateSize();
	}
	
	resetAllTransformations() {
		this.Init();
		this.selectedRotation = 0;
		this.xFlip = 0;
		this.yFlip = 0;
		this.selectedZoom = 1.0;
		this.UpdateSize();
	}
	
	Init()
	{
		if (this.htmlElement != null)
		{
			return;
		}
		//save current window scroll position
		let previousScrollX = window.scrollX;
		let previousScrollY = window.scrollY;
		
		//first recreate the entire HTML page to prevent the browser's own Image Viewer from conflicting
		this.htmlElement = document.getElementsByTagName("html")[0];
		let htmlElement2 = this.htmlElement.cloneNode(true);
		this.htmlElement.remove();
		document.appendChild(htmlElement2);
		this.htmlElement = htmlElement2;
		
		//get elements
		this.htmlElement = document.getElementsByTagName("html")[0];
		this.bodyElement = document.getElementsByTagName("body")[0];
		this.imgElement = document.getElementsByTagName("img")[0];
		
		//create "div" tag, and move the "img" tag inside of the "div" tag
		this.divElement = document.createElement("div");
		this.bodyElement.appendChild(this.divElement);
		this.divElement.appendChild(this.imgElement);
		
		//remove existing CSS class from img tag
		this.imgElement.className = "";
		
		//check if we are zoomed out (img tag has width and height not equal to natural size)
		if (this.imgElement.naturalWidth != this.imgElement.width)
		{
			this.zoomState = 0;
		}
		else
		{
			this.zoomState = 1;
		}
		
		this.imgElement.width = this.imgElement.naturalWidth;
		this.imgElement.height = this.imgElement.naturalHeight;
		
		//call UpdateSize twice because first call will remove the scroll bars
		this.UpdateSize();
		this.UpdateSize();
		
		//restore previous window scroll position
		window.scrollTo(previousScrollX, previousScrollY, "instant");
		
		//click handler: for zooming
		this.divElement.addEventListener("click", (mouseEvent)=>this.HandleClick(mouseEvent));
		//resize handler: for updating size when zoomed out
		window.addEventListener("resize", ()=>this.HandleResize());
	}
	
	UpdateSize()
	{
		let areWeSideways = !(this.selectedRotation == 0 || this.selectedRotation == 180 || this.selectedRotation == -180);
		
		let w0 = this.imgElement.naturalWidth;
		let h0 = this.imgElement.naturalHeight;
		
		let w1 = this.htmlElement.clientWidth;
		let h1 = this.htmlElement.clientHeight;
		
		let w = w0;
		let h = h0;
		
		//to remove centering:
		this.imgElement.style.inset="unset";
		this.imgElement.style.margin="unset";
		this.imgElement.style.position="unset";
		
		let transformString = "";
		if (this.xFlip)
		{
			transformString = transformString + " scaleX(-1)"
		}
		if (this.yFlip)
		{
			transformString = transformString + " scaleY(-1)"
		}
		
		if (areWeSideways)
		{
			let t = w;
			w = h;
			h = t;
		}
		
		if (this.zoomState == 0)
		{
			//zoomStage == 0: actual size, or zoomed out when too big
			let scale = Math.min(this.selectedZoom, Math.min(w1 / w, h1 / h))
			let w2 = w * scale;
			let h2 = h * scale;
			
			let imgW = w0 * scale;
			let imgH = h0 * scale;
			
			//resize the img element style
			this.imgElement.style.width = imgW + "px";
			this.imgElement.style.height = imgH + "px";
			
			//apply transformation
			if (this.selectedRotation == 0)
			{
				this.imgElement.style.transform = transformString;
			}
			else
			{
				if (!areWeSideways)
				{
					//no translate
					this.imgElement.style.transform = "rotate(" + this.selectedRotation + "deg) " + transformString;
				}
				else
				{
					//with translate
					let dX = (imgH - imgW) / 2;
					this.imgElement.style.transform = "translate(" + dX + "px, " + (-dX) + "px) rotate(" + this.selectedRotation + "deg) " + transformString;
				}
			}
			this.divElement.style.width = w2 + "px";
			this.divElement.style.height = h2 + "px";
			this.divElement.style.overflow = "clip";
			//center the div vertically
			this.divElement.style.position = "absolute";
			this.divElement.style.margin = "auto";
			this.divElement.style.inset = "0";
			
			if (scale < this.selectedZoom)
			{
				this.divElement.style.cursor = "zoom-in";
			}
			else
			{
				this.divElement.style.cursor = "";
			}
		}
		else
		{
			w = w * this.selectedZoom;
			h = h * this.selectedZoom;
			
			//unscaled (zoomed in to a big image)
			let imgW = w0 * this.selectedZoom;
			let imgH = h0 * this.selectedZoom;
			
			//set dimensions of the image to actual size
			this.imgElement.style.width = imgW + "px";
			this.imgElement.style.height = imgH + "px";
			
			//apply transformation
			if (this.selectedRotation == 0)
			{
				this.imgElement.style.transform = transformString;
			}
			else
			{
				if (!areWeSideways)
				{
					//no translate
					this.imgElement.style.transform = "rotate(" + this.selectedRotation + "deg) " + transformString;
				}
				else
				{
					//with translate
					let dX = (imgH - imgW) / 2;
					this.imgElement.style.transform = "translate(" + dX + "px, " + (-dX) + "px) rotate(" + this.selectedRotation + "deg) " + transformString;
				}
			}
			
			this.divElement.style.width = w + "px";
			this.divElement.style.height = h + "px";
			this.divElement.style.overflow = "clip";
			
			this.divElement.style.position = "absolute";
			this.divElement.style.inset = "0";
			if (h < h1)
			{
				this.divElement.style.margin = "auto";
			}
			else
			{
				//center the div horizontally
				this.divElement.style.margin = "0 auto 0 auto";
			}
			if (w > w1 || h > h1)
			{
				this.divElement.style.cursor = "zoom-out";
			}
			else
			{
				this.divElement.style.cursor = "";
			}
		}
	}
	
	HandleResize()
	{
		//don't run resize handler unless it's zoomed out
		if (this.zoomState == 0)
		{
			//run twice so it removes the scrollbars, then fills the space previously taken by them
			this.UpdateSize();
			this.UpdateSize();
		}
	}

	HandleClick(mouseEvent)
	{
		if (this.divElement.style.cursor == "zoom-out")
		{
			this.zoomState = 0;
			//run twice so it removes the scrollbars, then fills the space previously taken by them
			this.UpdateSize();
			this.UpdateSize();
			return;
		}
		if (this.divElement.style.cursor == "zoom-in")
		{
			let boundingClientRect = mouseEvent.explicitOriginalTarget.getBoundingClientRect();
			let clickX = mouseEvent.x - boundingClientRect.left;
			let clickY = mouseEvent.y - boundingClientRect.top;
			
			let imgW = boundingClientRect.width;
			let imgH = boundingClientRect.height;
			
			let xFrac = clickX / imgW;
			let yFrac = clickY / imgH;
			
			this.zoomState = 1;
			this.UpdateSize();
			//scroll to a proportinal coordinate
			
			imgW = parseFloat(this.divElement.style.width);
			imgH = parseFloat(this.divElement.style.height);
			
			let centerX = imgW * xFrac;
			let centerY = imgH * yFrac;
			
			let topLeftX = centerX - this.htmlElement.clientWidth / 2;
			let topLeftY = centerY - this.htmlElement.clientHeight / 2;
			
			window.scrollTo(topLeftX, topLeftY, "instant");
		}
	}
	
}
