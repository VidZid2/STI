'use client';

import React from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { MorphingModal } from '@/components/ui/morphing-modal';

import { Input } from '@/components/ui/input';

interface Props {
	children: React.ReactNode;
	onUpload: (file: File) => Promise<{ success: boolean }>;
	aspect?: number; // default 1 (square)
	maxSizeMB?: number; // default 20
	acceptedTypes?: string[]; // default jpg, jpeg, png, webp
}

export function AvatarUploader({
	children,
	onUpload,
	aspect = 1,
	maxSizeMB = 20,
	acceptedTypes = ['jpeg', 'jpg', 'png', 'webp'],
}: Props) {
	const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 });
	const [zoom, setZoom] = React.useState<number>(1);

	const [isPending, setIsPending] = React.useState<boolean>(false);
	const [photo, setPhoto] = React.useState<{ url: string; file: File | null }>({
		url: '',
		file: null,
	});
	const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(
		null,
	);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const img_ext = file.name.substring(file.name.lastIndexOf('.') + 1);
		const validExt = acceptedTypes.includes(img_ext);

		if (!validExt) {
			throw new Error('Selected file is not a supported image type');
		} else {
			if (parseFloat(String(file.size)) / (1024 * 1024) >= maxSizeMB) {
				throw new Error('Selected image is too large');
			} else {
				setPhoto({ url: URL.createObjectURL(file), file });
			}
		}
	};

	const handleCropComplete = (_: Area, croppedAreaPixels: Area) => {
		setCroppedAreaPixels(croppedAreaPixels);
	};

	const [open, onOpenChange] = React.useState<boolean>(false);

	React.useEffect(() => {
		if (open) {
			document.body.setAttribute('data-avatar-uploader-open', 'true');
		} else {
			document.body.removeAttribute('data-avatar-uploader-open');
		}
		return () => {
			document.body.removeAttribute('data-avatar-uploader-open');
		};
	}, [open]);

	const handleUpdate = async () => {
		if (photo?.file && croppedAreaPixels) {
			setIsPending(true);
			try {
				const croppedImg = await getCroppedImg(photo?.url, croppedAreaPixels);
				if (!croppedImg || !croppedImg.file) {
					throw new Error('Failed to crop image');
				}

				const file = new File(
					[croppedImg.file],
					photo.file?.name ?? 'cropped.jpeg',
					{
						type: photo.file?.type ?? 'image/jpeg',
					},
				);

				await onUpload(file);
				setPhoto({ url: '', file: null });
				onOpenChange(false);
			} catch (error) {
				throw error instanceof Error
					? error
					: new Error('Failed to update image');
			} finally {
				setIsPending(false);
			}
		} else {
			throw new Error('No image selected for upload');
		}
	};

	return (
		<>
			{React.isValidElement(children) ? (
				React.cloneElement(children as React.ReactElement, {
					onClick: (e: any) => {
						if ((children as any).props.onClick) {
							(children as any).props.onClick(e);
						}
						onOpenChange(true);
					}
				})
			) : (
				<span onClick={() => onOpenChange(true)}>{children}</span>
			)}

			<MorphingModal
				viewId={open ? "avatar-uploader" : null}
				onClose={() => {
					if (!photo?.file) onOpenChange(false);
				}}
				placement="center"
				className="max-w-[400px] sm:max-w-md"
			>
				<div className="flex flex-col w-full">
					<div className="flex flex-row items-start gap-4 text-left sm:text-left bg-transparent border-b-0 p-6 pb-4 relative z-10">
						<div className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-sm border bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20">
							<svg className="w-6 h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
								<circle cx="8.5" cy="8.5" r="1.5" />
								<polyline points="21 15 16 10 5 21" />
							</svg>
						</div>
						<div className="flex-1 min-w-0 pt-0.5">
							<div className="flex items-center gap-2 mb-1">
								<h2 className="text-[20px] font-extrabold tracking-tight leading-none text-zinc-900 dark:text-zinc-100">
									Upload Image
								</h2>
							</div>
							<p className="text-[12.5px] font-medium leading-[1.4] text-zinc-500 dark:text-zinc-400">
								Choose and customize your profile picture
							</p>
						</div>
					</div>
					<div className="px-4 py-2 space-y-2 overflow-y-auto max-h-[50vh] overscroll-contain">
						<Input
							disabled={isPending}
							onChange={handleFileChange}
							type="file"
							accept="image/*"
						/>
						{photo?.file && (
							<div className="bg-accent relative w-full h-[300px] sm:h-[400px] overflow-hidden rounded-lg">
								<Cropper
									image={photo.url}
									crop={crop}
									zoom={zoom}
									aspect={aspect}
									onCropChange={setCrop}
									onZoomChange={setZoom}
									onCropComplete={handleCropComplete}
									classes={{
										containerClassName: isPending
											? 'opacity-80 pointer-events-none'
											: '',
									}}
								/>
							</div>
						)}
					</div>

					<div className="grid w-full grid-cols-2 gap-3 mt-4 pb-6 px-4">
						<button
							className="w-full flex items-center justify-center gap-1.5 font-bold py-2.5 px-4 rounded-[14px] shadow-sm border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 focus:outline-none text-[13px] whitespace-nowrap hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
							type="button"
							disabled={isPending}
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</button>

						<button
							className="w-full flex items-center justify-center gap-1.5 font-bold py-2.5 px-4 rounded-[14px] shadow-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 focus:outline-none text-[13px] whitespace-nowrap hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
							type="button"
							onClick={handleUpdate}
							disabled={isPending}
						>
							{isPending ? 'Uploading...' : 'Update'}
						</button>
					</div>
				</div>
			</MorphingModal>
		</>
	);
}

const createImage = (url: string): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener('load', () => resolve(image));
		image.addEventListener('error', (error) => reject(error));
		image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues
		image.src = url;
	});

function getRadianAngle(degreeValue: number): number {
	return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
function rotateSize(
	width: number,
	height: number,
	rotation: number,
): { width: number; height: number } {
	const rotRad = getRadianAngle(rotation);

	return {
		width:
			Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
		height:
			Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
	};
}

type Flip = {
	horizontal: boolean;
	vertical: boolean;
};

async function getCroppedImg(
	imageSrc: string,
	pixelCrop: Area,
	rotation = 0,
	flip: Flip = { horizontal: false, vertical: false },
): Promise<{ url: string; file: Blob | null } | null> {
	const image = await createImage(imageSrc);
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new Error('Failed to create 2D context');
	}

	const rotRad = getRadianAngle(rotation);

	// calculate bounding box of the rotated image
	const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
		image.width,
		image.height,
		rotation,
	);

	// set canvas size to match the bounding box
	canvas.width = bBoxWidth;
	canvas.height = bBoxHeight;

	// translate canvas context to a central location to allow rotating and flipping around the center
	ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
	ctx.rotate(rotRad);
	ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
	ctx.translate(-image.width / 2, -image.height / 2);

	// draw rotated image
	ctx.drawImage(image, 0, 0);

	// extract cropped image
	const data = ctx.getImageData(
		pixelCrop.x,
		pixelCrop.y,
		pixelCrop.width,
		pixelCrop.height,
	);

	// set canvas width to final desired crop size - this clears context
	canvas.width = pixelCrop.width;
	canvas.height = pixelCrop.height;

	// paste cropped image
	ctx.putImageData(data, 0, 0);

	// return blob + object URL
	return new Promise((resolve, reject) => {
		canvas.toBlob((file) => {
			if (!file) {
				reject(new Error('Failed to generate cropped image blob'));
				return;
			}
			resolve({
				url: URL.createObjectURL(file),
				file,
			});
		});
	});
}
