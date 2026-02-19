/**
 * Performs hex to RGB conversion.
 * @param {*} hex - The hex color string to convert.
 * @returns {Array} - An array containing the RGB values.
 */

export function hexToRgb(hex: string): [number, number, number] {
	hex = hex.replace(/^#/, "");
	if (hex.length === 3) {
		hex = hex
			.split("")
			.map((x) => x + x)
			.join("");
	}
	const bigint = parseInt(hex, 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;
	return [r, g, b];
}
