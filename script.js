document.addEventListener('DOMContentLoaded', function() {
    // Get all elements from the DOM
    const calendarEl = document.getElementById('calendar');
    const monthYearEl = document.getElementById('month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const wholeMonthCheckbox = document.getElementById('whole-month-checkbox');
    const pricePerLiterInput = document.getElementById('pricePerLiter');
    const totalDaysEl = document.getElementById('total-days');
    const totalLitersEl = document.getElementById('total-liters');
    const totalAmountEl = document.getElementById('total-amount');
    const sendWhatsappBtn = document.getElementById('send-whatsapp-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const customerNameInput = document.getElementById('customerName');
    const phoneNumberInput = document.getElementById('phoneNumber');
    const addDataBtn = document.getElementById('add-data-btn');

    // Liter modal elements
    const literModal = document.getElementById('liter-modal');
    const modalDateText = document.getElementById('modal-date-text');
    const literInput = document.getElementById('liter-input');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    let modalTargetDay = null;

    // Alert Modal elements
    const alertModal = document.getElementById('alert-modal');
    const alertMessage = document.getElementById('alert-message');
    const alertOkBtn = document.getElementById('alert-ok-btn');

    // App state
    let currentDate = new Date();
    let selectedDays = new Map(); // Stores date string as key and liters as value

    // --- Calendar Logic ---
    function generateCalendar(date) {
        calendarEl.innerHTML = '';
        const year = date.getFullYear();
        const month = date.getMonth();

        monthYearEl.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay();

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const dayNameEl = document.createElement('div');
            dayNameEl.className = 'font-bold text-gray-600 day-name';
            dayNameEl.textContent = day;
            calendarEl.appendChild(dayNameEl);
        });

        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyEl = document.createElement('div');
            calendarEl.appendChild(emptyEl);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayEl.textContent = day;
            dayEl.className = 'calendar-day p-2 cursor-pointer flex items-center justify-centeh-10 w-10 mx-auto';
            dayEl.dataset.date = dateStr;

            if (selectedDays.has(dateStr)) {
                dayEl.classList.add('selected');
                const liters = selectedDays.get(dateStr);
                if (liters !== 1) {
                    const literBadge = document.createElement('span');
                    literBadge.className = 'absolute text-xs -mt-6 ml-6 bg-red-500 text-white rounded-full px-1.5 py-0.5';
                    literBadge.textContent = `${liters}L`;
                    dayEl.appendChild(literBadge);
                }
            }

            dayEl.addEventListener('click', () => handleDayClick(dayEl, dateStr));
            calendarEl.appendChild(dayEl);
        }
    }
            
    function handleDayClick(dayEl, dateStr) {
        if (dayEl.classList.contains('selected')) {
            modalTargetDay = dateStr;
            const currentDateObj = new Date(dateStr + 'T00:00:00'); // Fix for timezone issues
            modalDateText.textContent = `For ${currentDateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
            literInput.value = selectedDays.get(dateStr) || 1;
            literModal.classList.remove('hidden');
        } else {
            selectedDays.set(dateStr, 1);
            dayEl.classList.add('selected');
        }
        updateBill();
    }

    // --- Bill Calculation ---
    function updateBill() {
        let totalDays = selectedDays.size;
        let totalLiters = 0;
        selectedDays.forEach(liters => {
            totalLiters += liters;
        });
        const pricePerLiter = parseFloat(pricePerLiterInput.value) || 0;
        const totalAmount = totalLiters * pricePerLiter;

        totalDaysEl.textContent = totalDays;
        totalLitersEl.textContent = `${totalLiters.toFixed(2)} Liters`;
        totalAmountEl.textContent = `₹ ${totalAmount.toFixed(2)}`;
                
        generateCalendar(currentDate);
    }

    function selectAllDaysInMonth() {
        selectedDays.clear();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        if (wholeMonthCheckbox.checked) {
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                selectedDays.set(dateStr, 1);
            }
        }
        generateCalendar(currentDate);
        updateBill();
    }
            
    // --- WhatsApp Message Formatting ---
    function getBillAsText() {
        const customerName = customerNameInput.value.trim() || 'Valued Customer';
        const monthName = currentDate.toLocaleString('default', { month: 'long' });
        const year = currentDate.getFullYear();
        const pricePerLiter = parseFloat(pricePerLiterInput.value) || 0;
        const totalLiters = Array.from(selectedDays.values()).reduce((sum, liters) => sum + liters, 0);
        const totalAmount = totalLiters * pricePerLiter;

        let billText = `🐄 *Milk Bill - ${monthName} ${year}* 🐄\n\n`;
        billText += `Hi *${customerName}*,\n\n`;

        billText += `*Summary*\n`;
        billText += `Total Milk: *${totalLiters.toFixed(2)} L*\n`;
        billText += `Total Amount: *₹${totalAmount.toFixed(2)}*\n`;
        billText += `(Rate: ₹${pricePerLiter.toFixed(2)}/L)\n\n`;

        if(selectedDays.size > 0) {
            const allQuantitiesAreOne = Array.from(selectedDays.values()).every(l => l === 1);
            const sortedDays = Array.from(selectedDays.keys()).sort();

            if (allQuantitiesAreOne) {
                billText += `*Delivery Dates (1L each)*\n`;
                const dates = sortedDays.map(dateStr => new Date(dateStr + 'T00:00:00').getDate());
                const detailsChunks = [];
                const chunkSize = 8; // Can fit more dates per line
                for (let i = 0; i < dates.length; i += chunkSize) {
                    const chunk = dates.slice(i, i + chunkSize);
                    detailsChunks.push(chunk.join(', '));
                }
                billText += detailsChunks.join('\n');

            } else { // Quantities vary
                const specialDays = [];
                const standardDays = [];

                sortedDays.forEach(dateStr => {
                    const liters = selectedDays.get(dateStr);
                    if (liters !== 1) {
                        specialDays.push(dateStr);
                    } else {
                        standardDays.push(dateStr);
                    }
                });

                billText += `*Bill Details*\n`;

                if (specialDays.length > 0) {
                    specialDays.forEach(dateStr => {
                        const day = new Date(dateStr + 'T00:00:00').getDate();
                        const liters = selectedDays.get(dateStr);
                        billText += `  - Date ${day}: *${liters}L*\n`;
                    });
                }

                if (standardDays.length > 0) {
                    billText += `*Standard Delivery (1L each):*\n`;
                    const dates = standardDays.map(dateStr => new Date(dateStr + 'T00:00:00').getDate());
                    const detailsChunks = [];
                    const chunkSize = 8;
                    for (let i = 0; i < dates.length; i += chunkSize) {
                        const chunk = dates.slice(i, i + chunkSize);
                        detailsChunks.push(chunk.join(', '));
                    }
                    billText += detailsChunks.join('\n');
                }
            }
            billText += `\n\n`;
        }
                
        billText += `Thank you! 🙏`;
                
        return billText;
    }

            // --- Modals ---
            function showAlert(message) {
                alertMessage.textContent = message;
                alertModal.classList.remove('hidden');
            }

            // --- Event Listeners ---
            prevMonthBtn.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() - 1);
                wholeMonthCheckbox.checked = false;
                selectedDays.clear();
                generateCalendar(currentDate);
                updateBill();
            });

            nextMonthBtn.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() + 1);
                wholeMonthCheckbox.checked = false;
                selectedDays.clear();
                generateCalendar(currentDate);
                updateBill();
            });
            
            wholeMonthCheckbox.addEventListener('change', selectAllDaysInMonth);
            pricePerLiterInput.addEventListener('input', updateBill);
            customerNameInput.addEventListener('input', updateBill);
            
            modalSaveBtn.addEventListener('click', () => {
                const newLiters = parseFloat(literInput.value);
                if (!isNaN(newLiters) && newLiters > 0) {
                    selectedDays.set(modalTargetDay, newLiters);
                } else {
                    selectedDays.delete(modalTargetDay);
                }
                literModal.classList.add('hidden');
                updateBill();
            });

            modalCancelBtn.addEventListener('click', () => {
                literModal.classList.add('hidden');
            });

            alertOkBtn.addEventListener('click', () => {
                alertModal.classList.add('hidden');
            });

            // --- Action Buttons ---
            sendWhatsappBtn.addEventListener('click', () => {
                const phone = phoneNumberInput.value.trim();
                if (!phone || phone.length < 10) {
                    showAlert('Please enter a valid 10-digit phone number.');
                    return;
                }
                if (selectedDays.size === 0) {
                    showAlert('Please select at least one day to generate a bill.');
                    return;
                }
                const billText = getBillAsText();
                const encodedText = encodeURIComponent(billText);
                const whatsappUrl = `https://wa.me/91${phone}?text=${encodedText}`;
                window.open(whatsappUrl, '_blank');
            });

            downloadPdfBtn.addEventListener('click', () => {
                if (selectedDays.size === 0) {
                    showAlert('Please select at least one day to generate a PDF.');
                    return;
                }
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                // --- VARIABLE MAPPING & HELPER FUNCTIONS ---
                const customerName = customerNameInput.value.trim() || 'Customer';
                const phoneNumberFull = "91" + phoneNumberInput.value.trim();
                const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
                const currentYear = currentDate.getFullYear();
                const currentMonth = currentDate.getMonth();

                const pricePerLiter = parseFloat(pricePerLiterInput.value) || 0;
                const totalLiters = Array.from(selectedDays.values()).reduce((sum, liters) => sum + liters, 0);
                const totalAmount = totalLiters * pricePerLiter;
                const totalDaysCount = selectedDays.size;
                const actualDailySales = selectedDays;

                const colors = {
                    primary: [26, 188, 156],   // Teal
                    secondary: [44, 62, 80],    // Dark Blue-Gray
                    accent: [231, 76, 60],     // Red
                    success: [39, 174, 96],    // Green
                    dark: [52, 73, 94],        // Dark Gray
                    medium: [149, 165, 166],   // Medium Gray
                    light: [236, 240, 241],    // Light Gray
                    white: [255, 255, 255]
                };

                const setColor = (color) => doc.setTextColor.apply(null, color);
                const setFillColor = (color) => doc.setFillColor.apply(null, color);
                const setDrawColor = (color) => doc.setDrawColor.apply(null, color);

                // --- PAGE 1 ---
                setFillColor(colors.primary);
                doc.rect(0, 0, doc.internal.pageSize.width, 45, 'F');

                setColor(colors.white);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(22);
                doc.text('Shreenathji Gir Gaushala', doc.internal.pageSize.width / 2, 17, { align: 'center' });

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(12);
                doc.text('Fresh Milk Delivery Service', doc.internal.pageSize.width / 2, 28, { align: 'center' });

                setColor(colors.white);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(18);
                doc.text('Invoice', doc.internal.pageSize.width / 2, 38, { align: 'center' });

                let yPos = 70;

                setFillColor(colors.light);
                setDrawColor(colors.medium);
                doc.setLineWidth(0.5);
                doc.rect(20, yPos, 85, 40, 'FD'); // Using standard rect for reliability

                setColor(colors.dark);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Bill To:', 25, yPos + 10);

                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');
                doc.text(customerName, 25, yPos + 20);
                doc.text(`Phone: +${phoneNumberFull}`, 25, yPos + 28);
                
                setFillColor([248, 249, 250]);
                doc.rect(110, yPos, 85, 40, 'FD'); // Using standard rect for reliability

                setColor(colors.dark);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Summary:', 115, yPos + 10);

                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');
                doc.text(`Period: ${currentMonthName} ${currentYear}`, 115, yPos + 20);
                doc.text(`Total Quantity: ${totalLiters.toFixed(1)} L`, 115, yPos + 28);
                doc.text(`Rate: Rs. ${pricePerLiter.toFixed(2)}/L`, 115, yPos + 36);

                yPos += 60;

                setFillColor(colors.primary);
                setDrawColor(colors.primary);
                doc.rect(20, yPos, 175, 12, 'FD');
                
                setColor(colors.white);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Description', 25, yPos + 8);
                doc.text('Days', 80, yPos + 8, { align: 'center' });
                doc.text('Quantity', 110, yPos + 8, { align: 'center' });
                doc.text('Rate', 140, yPos + 8, { align: 'center' });
                doc.text('Amount', 175, yPos + 8, { align: 'center' });

                yPos += 12;

                setFillColor(colors.white);
                setDrawColor(colors.light);
                doc.rect(20, yPos, 175, 15, 'FD');
                
                setColor(colors.dark);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                doc.text('Fresh Gir Cow Milk', 25, yPos + 10);
                doc.text(totalDaysCount.toString(), 80, yPos + 10, { align: 'center' });
                doc.text(`${totalLiters.toFixed(1)} L`, 110, yPos + 10, { align: 'center' });
                doc.text(`Rs. ${pricePerLiter.toFixed(2)}`, 140, yPos + 10, { align: 'center' });
                doc.text(`Rs. ${totalAmount.toFixed(2)}`, 175, yPos + 10, { align: 'center' });

                yPos += 25;

                const totalBoxX = 65;
                const totalBoxY = yPos;
                const totalBoxWidth = 80;
                const totalBoxHeight = 25;
                const totalBoxCenter = totalBoxX + totalBoxWidth / 2;

                setFillColor(colors.accent);
                setDrawColor(colors.accent);
                doc.rect(totalBoxX, totalBoxY, totalBoxWidth, totalBoxHeight, 'FD'); // Using standard rect for reliability

                setColor(colors.white);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text('TOTAL AMOUNT', totalBoxCenter, totalBoxY + 9, { align: 'center' });
                doc.setFontSize(18);
                doc.text(`Rs. ${totalAmount.toFixed(2)}`, totalBoxCenter, totalBoxY + 19, { align: 'center' });

            yPos = doc.internal.pageSize.height - 40;
            setColor(colors.medium);
            doc.setFontSize(10);
            doc.text('Thank you for choosing Shreenathji Gir Gaushala!', doc.internal.pageSize.width / 2, yPos, { align: 'center' });
            doc.text('For any queries, please contact us.', doc.internal.pageSize.width / 2, yPos + 8, { align: 'center' });

            // --- PAGE 2 ---
            doc.addPage();
                
            setFillColor(colors.secondary);
            doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
                
            setColor(colors.white);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('Daily Delivery Schedule', doc.internal.pageSize.width / 2, 20, { align: 'center' });
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`${currentMonthName} ${currentYear}`, doc.internal.pageSize.width / 2, 30, { align: 'center' });

            yPos = 60;

            const startX = 20;
            const cellWidth = (doc.internal.pageSize.width - 40) / 7;
            const cellHeight = 30;

            const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const weekdayColors = [colors.accent, colors.primary, colors.primary, colors.primary, colors.primary, colors.primary, colors.success];

            for (let i = 0; i < weekdays.length; i++) {
                setFillColor(weekdayColors[i]);
                doc.rect(startX + (i * cellWidth), yPos, cellWidth, 15, 'F');
                    
                setColor(colors.white);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(weekdays[i], startX + (i * cellWidth) + (cellWidth / 2), yPos + 10, { align: 'center' });
            }
            yPos += 15;

            const firstDayOfMonthIndex = new Date(currentYear, currentMonth, 1).getDay();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

            let dayCounter = 1;
            let currentDayInWeek = firstDayOfMonthIndex;
            let currentWeekRow = 0;
                
            doc.setLineWidth(0.2); // Set line width for grid borders

            for (let i = 0; i < firstDayOfMonthIndex; i++) {
                const x = startX + (i * cellWidth);
                const y = yPos + (currentWeekRow * cellHeight);
                    
                setFillColor([250, 250, 250]);
                setDrawColor(colors.medium); // More visible border
                doc.rect(x, y, cellWidth, cellHeight, 'FD');
            }

            while (dayCounter <= daysInMonth) {
                const x = startX + (currentDayInWeek * cellWidth);
                const y = yPos + (currentWeekRow * cellHeight);

                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayCounter).padStart(2, '0')}`;
                const liters = actualDailySales.get(dateStr) || 0;

                if (liters > 0) {
                    setFillColor([232, 245, 233]); 
                } else {
                    setFillColor(colors.white);
                }
                setDrawColor(colors.medium); // More visible border
                doc.rect(x, y, cellWidth, cellHeight, 'FD');

                setColor(colors.dark);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(String(dayCounter), x + 3, y + 8);

                if (liters > 0) {
                    setColor(colors.success);
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${liters.toFixed(1)} L`, x + (cellWidth / 2), y + 20, { align: 'center' });

                    setFillColor(colors.success);
                    doc.circle(x + cellWidth - 8, y + 8, 2, 'F');
                } else {
                    setColor(colors.medium);
                    doc.setFontSize(8);
                    doc.text('No Delivery', x + (cellWidth / 2), y + 20, { align: 'center' });
                }

                dayCounter++;
                currentDayInWeek++;

                if (currentDayInWeek > 6) {
                    currentDayInWeek = 0;
                    currentWeekRow++;
                }
            }

            const legendY = yPos + (currentWeekRow + 1) * cellHeight + 10;
                
            setFillColor([232, 245, 233]);
            doc.rect(20, legendY, 8, 8, 'F');
            setColor(colors.dark);
            doc.setFontSize(10);
            doc.text('Delivery Day', 32, legendY + 6);
                
            setFillColor(colors.white);
            setDrawColor(colors.light);
            doc.rect(20, legendY + 13, 8, 8, 'FD');
            doc.text('No Delivery', 32, legendY + 19);

            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                setColor(colors.medium);
                doc.setFontSize(8);
                doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
            }
                
            const pdfName = `${customerName} ${currentMonthName} Bill.pdf`;
            doc.save(pdfName);
        });


addDataBtn.addEventListener('click', () => {
    const customerName = customerNameInput.value.trim();
    const mobileNumber = phoneNumberInput.value.trim();
    const billingPeriod = monthYearEl.textContent;
    const milkQuantity = totalLitersEl.textContent.replace(' Liters', '');
    const pricePerLiter = pricePerLiterInput.value.trim();
    const totalAmount = totalAmountEl.textContent.replace('₹ ', '');

    if (!customerName || !mobileNumber || selectedDays.size === 0) {
        showAlert('Please fill customer details and select at least one day.');
        return;
    }

    const data = {
        customerName,
        mobileNumber,
        billingPeriod,
        milkQuantity,
        pricePerLiter,
        totalAmount,
        secret: window.SECRET_KEY // 🔹 Secure key from config.js
    };

    fetch(window.GOOGLE_SHEET_WEBAPP_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
    })
    .then(() => {
        showAlert("✅ Data added to Google Sheet!");
    })
    .catch(err => showAlert("Error: " + err));
});




    // --- Initial Load ---
    generateCalendar(currentDate);
    updateBill();
});