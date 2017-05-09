// Virtual DOM for unit tests

function TextNode(ownerDocument, text) {
	this.ownerDocument = ownerDocument;
	this.text = text;
}
function Element(ownerDocument, tagName) {
	this.ownerDocument = ownerDocument;
	this.tagName = tagName;
	this.attributes = {};
	this.childNodes = [];
	Object.defineProperty(this, 'textContent', {
		get: function() {
			var res = '';
			for (var i = 0;i < this.childNodes.length;i++) {
				var node = this.childNodes[i];
				if (node instanceof TextNode) {
					res += node.text;
				}
			}
			return res;
		},
	});
}
Element.prototype.setAttribute = function(k, v) {
	this.attributes[k] = v;
};
Element.prototype.appendChild = function(node) {
	this.childNodes.push(node);
};
function Document(tagName) {
	this.documentElement = new Element(this, tagName);
}
Document.prototype.createElement = function(tagName) {
	return new Element(this, tagName);
};
Document.prototype.createElementNS = function(namespace, tagName) {
	return new Element(this, tagName);
};
Document.prototype.createTextNode = function(text) {
	return new TextNode(this, text);
};

module.exports = {
	Document,
};
