import { Box3, Matrix4 } from 'three';
import { ExtendedTriangle } from '../../math/ExtendedTriangle.js';
import { PrimitivePool } from '../../utils/PrimitivePool.js';
import { setTriangle } from '../../utils/TriangleUtilities.js';

const aabb = /* @__PURE__ */ new Box3();
const aabb2 = /* @__PURE__ */ new Box3();
const tempMatrix = /* @__PURE__ */ new Matrix4();
const trianglePool = /* @__PURE__ */ new PrimitivePool( () => new ExtendedTriangle() );

export function bvhcast( bvh, otherBvh, matrixToLocal, callbacks ) {

	// BVHCast function for intersecting two BVHs against each other. Ultimately just uses two recursive shapecast calls rather
	// than an approach that walks down the tree (see bvhcast.js file for more info).

	let {
		intersectsRanges,
		intersectsTriangles,
	} = callbacks;

	const indexAttr = bvh.geometry.index;
	const positionAttr = bvh.geometry.attributes.position;

	const otherIndexAttr = otherBvh.geometry.index;
	const otherPositionAttr = otherBvh.geometry.attributes.position;

	tempMatrix.copy( matrixToLocal ).invert();

	const triangle = trianglePool.getPrimitive();
	const triangle2 = trianglePool.getPrimitive();

	if ( intersectsTriangles ) {

		function iterateOverDoubleTriangles( offset1, count1, offset2, count2, depth1, index1, depth2, index2 ) {

			for ( let i2 = offset2, l2 = offset2 + count2; i2 < l2; i2 ++ ) {

				setTriangle( triangle2, i2 * 3, otherIndexAttr, otherPositionAttr );
				triangle2.a.applyMatrix4( matrixToLocal );
				triangle2.b.applyMatrix4( matrixToLocal );
				triangle2.c.applyMatrix4( matrixToLocal );
				triangle2.needsUpdate = true;

				for ( let i1 = offset1, l1 = offset1 + count1; i1 < l1; i1 ++ ) {

					setTriangle( triangle, i1 * 3, indexAttr, positionAttr );
					triangle.needsUpdate = true;

					if ( intersectsTriangles( triangle, triangle2, i1, i2, depth1, index1, depth2, index2 ) ) {

						return true;

					}

				}

			}

			return false;

		}

		if ( intersectsRanges ) {

			const originalIntersectsRanges = intersectsRanges;
			intersectsRanges = function ( offset1, count1, offset2, count2, depth1, index1, depth2, index2 ) {

				if ( ! originalIntersectsRanges( offset1, count1, offset2, count2, depth1, index1, depth2, index2 ) ) {

					return iterateOverDoubleTriangles( offset1, count1, offset2, count2, depth1, index1, depth2, index2 );

				}

				return true;

			};

		} else {

			intersectsRanges = iterateOverDoubleTriangles;

		}

	}

	otherBvh.getBoundingBox( aabb2 );
	aabb2.applyMatrix4( matrixToLocal );
	const result = bvh.shapecast( {

		intersectsBounds: box => aabb2.intersectsBox( box ),

		intersectsRange: ( offset1, count1, contained, depth1, nodeIndex1, box ) => {

			aabb.copy( box );
			aabb.applyMatrix4( tempMatrix );
			return otherBvh.shapecast( {

				intersectsBounds: box => aabb.intersectsBox( box ),

				intersectsRange: ( offset2, count2, contained, depth2, nodeIndex2 ) => {

					return intersectsRanges( offset1, count1, offset2, count2, depth1, nodeIndex1, depth2, nodeIndex2 );

				},

			} );

		}

	} );

	trianglePool.releasePrimitive( triangle );
	trianglePool.releasePrimitive( triangle2 );
	return result;

}
