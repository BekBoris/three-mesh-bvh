import { intersectTri } from './ThreeRayIntersectUtilities.js';

export function intersectTris_indirect( bvh, side, ray, offset, count, intersections ) {

	const { geometry, _indirectBuffer } = bvh;
	for ( let i = offset, end = offset + count; i < end; i ++ ) {

		let vi = _indirectBuffer ? _indirectBuffer[ i ] : i;
		intersectTri( geometry, side, ray, vi, intersections );

	}

}

export function intersectTris( bvh, side, ray, offset, count, intersections ) {

	const { geometry } = bvh;
	for ( let i = offset, end = offset + count; i < end; i ++ ) {

		intersectTri( geometry, side, ray, i, intersections );

	}

}

export function intersectClosestTri_indirect( bvh, side, ray, offset, count ) {

	const { geometry, _indirectBuffer } = bvh;
	let dist = Infinity;
	let res = null;
	for ( let i = offset, end = offset + count; i < end; i ++ ) {

		let vi = _indirectBuffer ? _indirectBuffer[ i ] : i;
		const intersection = intersectTri( geometry, side, ray, vi );
		if ( intersection && intersection.distance < dist ) {

			res = intersection;
			dist = intersection.distance;

		}

	}

	return res;

}

export function intersectClosestTri( bvh, side, ray, offset, count ) {

	const { geometry } = bvh;
	let dist = Infinity;
	let res = null;
	for ( let i = offset, end = offset + count; i < end; i ++ ) {

		const intersection = intersectTri( geometry, side, ray, i );
		if ( intersection && intersection.distance < dist ) {

			res = intersection;
			dist = intersection.distance;

		}

	}

	return res;

}

// converts the given BVH raycast intersection to align with the three.js raycast
// structure (include object, world space distance and point).
export function convertRaycastIntersect( hit, object, raycaster ) {

	if ( hit === null ) {

		return null;

	}

	hit.point.applyMatrix4( object.matrixWorld );
	hit.distance = hit.point.distanceTo( raycaster.ray.origin );
	hit.object = object;

	if ( hit.distance < raycaster.near || hit.distance > raycaster.far ) {

		return null;

	} else {

		return hit;

	}

}
