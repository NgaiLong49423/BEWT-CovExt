package test;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import po.CalendarAgendaPage;
import po.IndexPage;

public class Claroline_RemoveCourseEventTest extends BaseTest {
	
	@Test
	public void removeCourseEvent() throws InterruptedException{
		CalendarAgendaPage cap = new IndexPage(driver)
				.login(requiredRuntimeCredential("CLAROLINE_TEST_USERNAME"), requiredRuntimeCredential("CLAROLINE_TEST_PASSWORD"))
				.goInsideCourse()
				.goToCalendarAgendaPage()
				.removeEvent();
		
		assertEquals("All events deleted from the agenda", cap.getCourseMessage());
		cap.doLogout();
	}
}
