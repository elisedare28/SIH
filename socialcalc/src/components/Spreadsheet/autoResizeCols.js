export const autoSizeColumns = (hotInstance) => {
    const hot = hotInstance.hotInstance;
    const colCount = hotInstance.countCols();
  
    for (let col = 0; col < colCount; col++) {
      hot.autosizeColumn(col);
    }
  };
