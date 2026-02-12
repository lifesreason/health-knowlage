type PosterOptions = {
  canvasId: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  qrcodeUrl?: string;
};

const toImageInfo = (src: string) =>
  new Promise<UniApp.GetImageInfoSuccessData | null>((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    uni.getImageInfo({
      src,
      success: (res) => resolve(res),
      fail: () => resolve(null),
    });
  });

const canvasToTempPath = (canvasId: string, width: number, height: number) =>
  new Promise<string>((resolve, reject) => {
    uni.canvasToTempFilePath({
      canvasId,
      width,
      height,
      destWidth: width * 2,
      destHeight: height * 2,
      success: (res) => resolve(res.tempFilePath),
      fail: reject,
    });
  });

export const buildSharePoster = async (options: PosterOptions) => {
  const width = 540;
  const height = 960;
  const imageHeight = 620;

  const ctx = uni.createCanvasContext(options.canvasId);
  const imageInfo = await toImageInfo(options.imageUrl || '');
  const qrcodeInfo = await toImageInfo(options.qrcodeUrl || '');

  ctx.setFillStyle('#f7f8fa');
  ctx.fillRect(0, 0, width, height);

  ctx.setFillStyle('#ffffff');
  ctx.fillRect(20, 20, width - 40, height - 40);

  if (imageInfo) {
    ctx.drawImage(imageInfo.path, 40, 40, width - 80, imageHeight);
  } else {
    ctx.setFillStyle('#e9ecef');
    ctx.fillRect(40, 40, width - 80, imageHeight);
    ctx.setFillStyle('#8a8f98');
    ctx.setFontSize(24);
    ctx.fillText('银龄健康', width / 2 - 48, 360);
  }

  ctx.setFillStyle('#1f2937');
  ctx.setFontSize(30);
  const title = options.title || '银龄健康';
  const clippedTitle = title.length > 24 ? `${title.slice(0, 24)}...` : title;
  ctx.fillText(clippedTitle, 40, imageHeight + 110);

  ctx.setFillStyle('#6b7280');
  ctx.setFontSize(22);
  const subtitle = options.subtitle || '长按识别，查看更多健康内容';
  const clippedSubtitle = subtitle.length > 28 ? `${subtitle.slice(0, 28)}...` : subtitle;
  ctx.fillText(clippedSubtitle, 40, imageHeight + 160);

  ctx.setFillStyle('#f97316');
  ctx.fillRect(40, height - 200, width - 80, 110);
  ctx.setFillStyle('#ffffff');
  ctx.setFontSize(26);
  ctx.fillText('银龄健康社区', 60, height - 145);
  ctx.setFontSize(20);
  ctx.fillText('长按识别小程序码', 60, height - 105);

  if (qrcodeInfo) {
    ctx.setFillStyle('#ffffff');
    ctx.fillRect(width - 150, height - 190, 90, 90);
    ctx.drawImage(qrcodeInfo.path, width - 146, height - 186, 82, 82);
  }

  ctx.draw(false);
  await new Promise((resolve) => setTimeout(resolve, 220));
  return canvasToTempPath(options.canvasId, width, height);
};

export const previewOrSavePoster = async (filePath: string) => {
  const action = await new Promise<number | null>((resolve) => {
    uni.showActionSheet({
      itemList: ['预览海报', '保存到相册'],
      success: (res) => resolve(res.tapIndex),
      fail: () => resolve(null),
    });
  });

  if (action === 0) {
    uni.previewImage({ urls: [filePath], current: 0 });
    return;
  }

  if (action === 1) {
    uni.saveImageToPhotosAlbum({
      filePath,
      success: () => {
        uni.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: () => {
        uni.showModal({
          title: '保存失败',
          content: '请检查相册权限后重试',
          showCancel: false,
        });
      },
    });
  }
};
